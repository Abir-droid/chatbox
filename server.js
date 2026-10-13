'use strict';

/*
 * chatbox server
 *
 * Express serves the page and static files, Socket.IO carries the real-time
 * messages, and PostgreSQL (via `pg`) keeps rooms and message history.
 *
 * Subpath deployment (e.g. https://abirdroid.ddns.net/chatbox):
 *   Set APPLICATION_ROOT=/chatbox. The app then works whether or not the
 *   reverse proxy (Traefik in Coolify) strips the prefix before forwarding:
 *     - a request for /chatbox/static/app.js and one for /static/app.js both work
 *     - the same applies to /chatbox/socket.io/ and /socket.io/ (WebSocket upgrades too)
 *   Every URL the browser uses is generated with the prefix, so nothing is hardcoded.
 *   Leave APPLICATION_ROOT unset for root deployments and local development.
 */

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const express = require('express');
const { Server } = require('socket.io');
const { Pool } = require('pg');

/* ------------------------------------------------------------------ config */

function normalizePrefix(value) {
  let p = String(value || '').trim();
  if (!p || p === '/') return '';
  if (!p.startsWith('/')) p = '/' + p;
  return p.replace(/\/+$/, '');
}

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const PREFIX = normalizePrefix(process.env.APPLICATION_ROOT); // '' or '/chatbox'
const DATABASE_URL = process.env.DATABASE_URL;

const DEFAULT_ROOM = 'general';
const LIMITS = {
  nameMin: 2,
  nameMax: 24,
  textMax: 1000,
  maxRooms: 40,
  historyLoad: 100, // messages sent to a client when it joins a room
  historyKeep: 500, // messages kept per room
  rateBurst: 6, // messages allowed in a burst ...
  rateRefillMs: 1000, // ... then one more per second
};

let pool;
if (DATABASE_URL && DATABASE_URL !== 'memory') {
  pool = new Pool({
    connectionString: DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    // Only needed when your PostgreSQL requires TLS (set PGSSL=true). Most LAN / same-network setups do not.
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: process.env.PGSSL_REJECT_UNAUTHORIZED !== 'false' } : undefined,
  });
  pool.on('error', (err) => console.error('postgres pool error:', err.message));
} else if (process.env.NODE_ENV === 'production') {
  console.error(
    'DATABASE_URL is not set. Example: postgres://chatbox:password@localhost:5432/chatbox\n' +
      'In Coolify, add it under Environment Variables.'
  );
  process.exit(1);
} else {
  // In development/testing without Docker or external DB, fall back to in-memory PostgreSQL emulator
  try {
    const { newDb } = require('pg-mem');
    const { Pool: MemPool } = newDb().adapters.createPg();
    pool = new MemPool();
    pool.on('error', (err) => console.error('postgres pool error:', err.message));
    console.log('ℹ️  DATABASE_URL is not set: using in-memory PostgreSQL emulator for local testing.');
  } catch (err) {
    console.error(
      'DATABASE_URL is not set and pg-mem is not installed.\n' +
        'Locally, copy .env.example to .env and set DATABASE_URL, or run npm install.'
    );
    process.exit(1);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Tables are prefixed with "chat_" so they never collide with other apps sharing this database.
async function initDatabase() {
  for (let attempt = 1; ; attempt++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS chat_rooms (
          name       TEXT PRIMARY KEY,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS chat_messages (
          id         BIGSERIAL PRIMARY KEY,
          room       TEXT NOT NULL REFERENCES chat_rooms (name) ON DELETE CASCADE,
          username   TEXT NOT NULL,
          body       TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages (room, id DESC);
      `);
      break;
    } catch (err) {
      if (attempt >= 15) throw err;
      console.error(`database not ready (attempt ${attempt}/15): ${err.message}`);
      await sleep(2000);
    }
  }
  await pool.query('INSERT INTO chat_rooms (name) VALUES ($1) ON CONFLICT DO NOTHING', [DEFAULT_ROOM]);
  const { rows } = await pool.query('SELECT name FROM chat_rooms ORDER BY created_at, name');
  roomNames = rows.map((r) => r.name);
}

// Room names are kept in memory too (rooms are few); this instance is the only writer.
let roomNames = [];

async function ensureRoom(room) {
  if (roomNames.includes(room)) return true;
  if (roomNames.length >= LIMITS.maxRooms) return false;
  await pool.query('INSERT INTO chat_rooms (name) VALUES ($1) ON CONFLICT DO NOTHING', [room]);
  if (!roomNames.includes(room)) {
    roomNames.push(room);
  }
  return true;
}

async function saveMessage(room, user, text) {
  const { rows } = await pool.query(
    'INSERT INTO chat_messages (room, username, body) VALUES ($1, $2, $3) RETURNING id, created_at',
    [room, user, text]
  );
  // Trim old history in the background; a failure here must never block chatting.
  pool
    .query(
      'DELETE FROM chat_messages WHERE room = $1 AND id <= ' +
        '(SELECT id FROM chat_messages WHERE room = $1 ORDER BY id DESC LIMIT 1 OFFSET $2)',
      [room, LIMITS.historyKeep]
    )
    .catch((err) => console.error('history trim failed:', err.message));
  return { id: Number(rows[0].id), room, user, text, ts: new Date(rows[0].created_at).getTime() };
}

async function loadHistory(room) {
  const { rows } = await pool.query(
    'SELECT id, room, username, body, created_at FROM chat_messages WHERE room = $1 ORDER BY id DESC LIMIT $2',
    [room, LIMITS.historyLoad]
  );
  return rows
    .map((r) => ({
      id: Number(r.id),
      room: r.room,
      user: r.username,
      text: r.body,
      ts: new Date(r.created_at).getTime(),
    }))
    .reverse();
}

/* -------------------------------------------------------------- validation */

const NAME_RE = /^[\p{L}\p{N}][\p{L}\p{M}\p{N} ._-]*$/u;
const ROOM_RE = /^[a-z0-9][a-z0-9_-]{0,23}$/;
// control characters (incl. NUL, which PostgreSQL rejects) and bidi overrides (used to spoof text direction)
const UNSAFE_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g;

function cleanName(value) {
  if (typeof value !== 'string') return null;
  const name = value.normalize('NFC').replace(UNSAFE_CHARS_RE, '').replace(/\s+/g, ' ').trim();
  if (name.length < LIMITS.nameMin || name.length > LIMITS.nameMax) return null;
  return NAME_RE.test(name) ? name : null;
}

function cleanRoom(value) {
  if (typeof value !== 'string') return null;
  const room = value.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-');
  return ROOM_RE.test(room) ? room : null;
}

function cleanText(value) {
  if (typeof value !== 'string') return null;
  const text = value.replace(/\r\n?/g, '\n').replace(UNSAFE_CHARS_RE, '').trim();
  return text && text.length <= LIMITS.textMax ? text : null;
}

function takeToken(bucket) {
  const now = Date.now();
  bucket.tokens = Math.min(LIMITS.rateBurst, bucket.tokens + (now - bucket.last) / LIMITS.rateRefillMs);
  bucket.last = now;
  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;
  return true;
}

/* -------------------------------------------------------------------- http */

const ASSET_VERSION = String(Date.now()); // cache-busts static files after every restart
const indexHtml = fs
  .readFileSync(path.join(__dirname, 'views', 'index.html'), 'utf8')
  .replaceAll('{{BASE}}', PREFIX)
  .replaceAll('{{VERSION}}', ASSET_VERSION);

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self' ws: wss:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );
  next();
});

app.get('/', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.type('html').send(indexHtml);
});

app.get('/healthz', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: true, uptime: Math.round(process.uptime()) });
  } catch (err) {
    res.status(503).json({ ok: false, db: false });
  }
});

app.use('/static', express.static(path.join(__dirname, 'public'), { index: false, maxAge: '7d' }));

app.use((req, res) => res.status(404).type('text').send('Not found'));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('http error:', err);
  res.status(500).type('text').send('Server error');
});

const server = http.createServer(app);
// Behind Traefik: keep idle connections open longer than the proxy does, which avoids sporadic 502s.
server.keepAliveTimeout = 120_000;
server.headersTimeout = 121_000;

/* ---------------------------------------------------------------- realtime */

const io = new Server(server, {
  path: '/socket.io', // internal path; the prefix is stripped below before Socket.IO sees a request
  maxHttpBufferSize: 16 * 1024,
  pingInterval: 25_000,
  pingTimeout: 20_000,
  connectTimeout: 15_000,
});

// Remove the subpath from req.url if the proxy did not already do it. Prepended so it runs before
// Express and Socket.IO/engine.io look at the URL, for normal requests and WebSocket upgrades alike.
function stripPrefix(req) {
  if (!PREFIX) return;
  const url = req.url || '/';
  if (url === PREFIX) req.url = '/';
  else if (url.startsWith(PREFIX + '/')) req.url = url.slice(PREFIX.length);
  else if (url.startsWith(PREFIX + '?')) req.url = '/' + url.slice(PREFIX.length);
}
server.prependListener('request', stripPrefix);
server.prependListener('upgrade', stripPrefix);

const roomKey = (room) => `r:${room}`;
const byName = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' });

function presence(room) {
  const ids = io.sockets.adapter.rooms.get(roomKey(room));
  const names = new Set();
  if (ids) {
    for (const id of ids) {
      const s = io.sockets.sockets.get(id);
      if (s && s.data.name) names.add(s.data.name);
    }
  }
  return names;
}

function emitPresence(room) {
  io.to(roomKey(room)).emit('presence', { room, users: [...presence(room)].sort(byName) });
}

function roomsSnapshot() {
  return roomNames.map((name) => ({
    name,
    online: (io.sockets.adapter.rooms.get(roomKey(name)) || { size: 0 }).size,
  }));
}

function emitRooms() {
  io.emit('rooms', roomsSnapshot());
}

function leaveCurrentRoom(socket) {
  const { name, room } = socket.data;
  if (!room) return;
  socket.leave(roomKey(room));
  socket.data.room = null;
  io.to(roomKey(room)).emit('typing', { room, user: name, typing: false });
  if (name && !presence(room).has(name)) {
    io.to(roomKey(room)).emit('system', { room, text: `${name} left`, ts: Date.now() });
  }
  emitPresence(room);
}

// Join and message handlers await the database. Running them one at a time per socket keeps
// messages in order and stops two quick room switches from interleaving.
function enqueue(socket, task) {
  socket.data.queue = socket.data.queue.then(task).catch((err) => console.error('socket task failed:', err));
}

io.on('connection', (socket) => {
  socket.data = {
    name: null,
    room: null,
    bucket: { tokens: LIMITS.rateBurst, last: Date.now() },
    lastTyping: 0,
    queue: Promise.resolve(),
  };

  socket.on('join', (payload, ack) => {
    const reply = typeof ack === 'function' ? ack : () => {};
    const name = cleanName(payload && payload.name);
    const room = cleanRoom(payload && payload.room);
    if (!name) {
      return reply({
        ok: false,
        code: 'name',
        error: `Names need ${LIMITS.nameMin}–${LIMITS.nameMax} characters: letters, numbers, spaces, dots, dashes or underscores.`,
      });
    }
    if (!room) {
      return reply({
        ok: false,
        code: 'room',
        error: 'Room names use 1–24 lowercase letters, numbers, dashes or underscores.',
      });
    }

    enqueue(socket, async () => {
      try {
        if (!(await ensureRoom(room))) {
          return reply({
            ok: false,
            code: 'limit',
            error: `This server supports up to ${LIMITS.maxRooms} rooms. Join an existing one.`,
          });
        }
        if (socket.disconnected) return;

        if (socket.data.room !== room || socket.data.name !== name) {
          leaveCurrentRoom(socket);
          socket.data.name = name;
          socket.data.room = room;
          const alreadyHere = presence(room).has(name);
          // Join the live room first, then read history: the client queues anything that arrives in
          // between and de-duplicates it by id, so no message can fall through the gap.
          socket.join(roomKey(room));
          if (!alreadyHere) {
            socket.to(roomKey(room)).emit('system', { room, text: `${name} joined`, ts: Date.now() });
          }
          emitPresence(room);
          emitRooms();
        }

        const history = await loadHistory(room);
        if (socket.disconnected) return;
        reply({
          ok: true,
          name,
          room,
          history,
          users: [...presence(room)].sort(byName),
          rooms: roomsSnapshot(),
        });
      } catch (err) {
        console.error('join failed:', err);
        reply({ ok: false, code: 'server', error: 'Something went wrong on the server. Try again.' });
      }
    });
  });

  socket.on('message', (payload, ack) => {
    const reply = typeof ack === 'function' ? ack : () => {};
    if (!socket.data.name || !socket.data.room) {
      return reply({ ok: false, error: 'Join a room before sending messages.' });
    }
    if (!takeToken(socket.data.bucket)) {
      return reply({ ok: false, error: 'You are sending messages too fast. Wait a moment.' });
    }
    const text = cleanText(payload && payload.text);
    if (!text) {
      return reply({ ok: false, error: `Messages need 1–${LIMITS.textMax} characters.` });
    }

    enqueue(socket, async () => {
      const { name, room } = socket.data;
      if (!name || !room) return reply({ ok: false, error: 'Join a room before sending messages.' });
      try {
        const message = await saveMessage(room, name, text);
        io.to(roomKey(room)).emit('message', message);
        reply({ ok: true });
      } catch (err) {
        console.error('message failed:', err);
        reply({ ok: false, error: 'The message could not be saved. Try again.' });
      }
    });
  });

  socket.on('typing', (isTyping) => {
    const { name, room } = socket.data;
    if (!name || !room) return;
    const now = Date.now();
    if (isTyping && now - socket.data.lastTyping < 800) return;
    socket.data.lastTyping = now;
    socket.to(roomKey(room)).emit('typing', { room, user: name, typing: Boolean(isTyping) });
  });

  socket.on('disconnect', () => {
    leaveCurrentRoom(socket);
    emitRooms();
  });
});

/* ---------------------------------------------------------------- lifecycle */

let shuttingDown = false;
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down`);
  io.close(async () => {
    try {
      await pool.end();
    } catch (err) {
      console.error('closing database pool:', err.message);
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 8000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (err) => console.error('unhandled rejection:', err));

function startServer() {
  return initDatabase()
    .then(() => {
      return new Promise((resolve) => {
        server.listen(PORT, HOST, () => {
          console.log(`chatbox listening on http://${HOST}:${PORT}${PREFIX || '/'}`);
          console.log(`  prefix: ${PREFIX || '(none, serving from root)'}`);
          console.log(`  database: ${DATABASE_URL && DATABASE_URL !== 'memory' ? 'postgres (connected)' : 'in-memory postgres (pg-mem)'}`);
          resolve(server);
        });
      });
    })
    .catch((err) => {
      console.error('Could not initialise the database:', err.message);
      process.exit(1);
    });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  server,
  io,
  getPool: () => pool,
  initDatabase,
  startServer,
  stripPrefix,
  ensureRoom,
  saveMessage,
  loadHistory,
  PREFIX,
  PORT,
};
