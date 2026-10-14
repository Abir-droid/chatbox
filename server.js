'use strict';

/*
 * chatbox server
 *
 * Full-featured real-time chat with phone number auth, 1-on-1 direct messages,
 * group chats with member management, friend lists, emoji & media (photo/video),
 * soft deletion, browser notifications, and an admin audit & moderation dashboard.
 *
 * Subpath deployment (e.g. https://abirdroid.ddns.net/chatbox):
 *   Set APPLICATION_ROOT=/chatbox. Works whether or not the reverse proxy
 *   (Traefik in Coolify) strips the prefix before forwarding.
 */

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const express = require('express');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const multer = require('multer');

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
const ADMIN_PHONE = (process.env.ADMIN_PHONE || '').trim();
const SESSION_SECRET = process.env.SESSION_SECRET || 'chatbox-secret-key-32894723984723984';

const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/* ---------------------------------------------------------------- database */

let pool;
if (DATABASE_URL && DATABASE_URL !== 'memory') {
  pool = new Pool({
    connectionString: DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
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

async function initDatabase() {
  for (let attempt = 1; ; attempt++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS chat_users (
          id             BIGSERIAL PRIMARY KEY,
          phone          TEXT UNIQUE NOT NULL,
          name           TEXT NOT NULL,
          password_hash  TEXT NOT NULL,
          avatar_color   INTEGER NOT NULL DEFAULT 0,
          is_admin       BOOLEAN NOT NULL DEFAULT FALSE,
          is_suspended   BOOLEAN NOT NULL DEFAULT FALSE,
          created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS chat_friends (
          id             BIGSERIAL PRIMARY KEY,
          user_id        BIGINT NOT NULL REFERENCES chat_users (id) ON DELETE CASCADE,
          friend_id      BIGINT NOT NULL REFERENCES chat_users (id) ON DELETE CASCADE,
          created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (user_id, friend_id)
        );

        CREATE TABLE IF NOT EXISTS chat_conversations (
          id             BIGSERIAL PRIMARY KEY,
          type           TEXT NOT NULL, -- 'direct' or 'group'
          name           TEXT,          -- group name
          created_by     BIGINT REFERENCES chat_users (id) ON DELETE SET NULL,
          created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS chat_conversation_members (
          conversation_id BIGINT NOT NULL REFERENCES chat_conversations (id) ON DELETE CASCADE,
          user_id         BIGINT NOT NULL REFERENCES chat_users (id) ON DELETE CASCADE,
          role            TEXT NOT NULL DEFAULT 'member', -- 'admin' or 'member'
          joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
          PRIMARY KEY (conversation_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS chat_messages (
          id              BIGSERIAL PRIMARY KEY,
          conversation_id BIGINT REFERENCES chat_conversations (id) ON DELETE CASCADE,
          sender_id       BIGINT REFERENCES chat_users (id) ON DELETE CASCADE,
          sender_name     TEXT,
          body            TEXT NOT NULL DEFAULT '',
          media_url       TEXT,
          media_type      TEXT,
          media_name      TEXT,
          is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,
          created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        -- Safe column migrations if chat_messages existed from previous schema
        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS conversation_id BIGINT;
        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sender_id BIGINT;
        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS sender_name TEXT;
        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS media_url TEXT;
        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS media_type TEXT;
        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS media_name TEXT;
        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

        -- Migrations for profile pic, conversation clear, and friend requests
        ALTER TABLE chat_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
        ALTER TABLE chat_conversation_members ADD COLUMN IF NOT EXISTS cleared_at TIMESTAMPTZ;
        ALTER TABLE chat_conversation_members ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;

        CREATE TABLE IF NOT EXISTS chat_friend_requests (
          id             BIGSERIAL PRIMARY KEY,
          sender_id      BIGINT NOT NULL REFERENCES chat_users (id) ON DELETE CASCADE,
          receiver_id    BIGINT NOT NULL REFERENCES chat_users (id) ON DELETE CASCADE,
          status         TEXT NOT NULL DEFAULT 'pending',
          created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (sender_id, receiver_id)
        );

        CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_id ON chat_messages (conversation_id, id DESC);
        CREATE INDEX IF NOT EXISTS idx_chat_conv_members_user ON chat_conversation_members (user_id);
        CREATE INDEX IF NOT EXISTS idx_chat_friends_user ON chat_friends (user_id);
        CREATE INDEX IF NOT EXISTS idx_chat_friend_requests_recv ON chat_friend_requests (receiver_id, status);
        CREATE INDEX IF NOT EXISTS idx_chat_friend_requests_sender ON chat_friend_requests (sender_id, status);
      `);

      try {
        await pool.query(`
          ALTER TABLE chat_messages ALTER COLUMN room DROP NOT NULL;
          ALTER TABLE chat_messages ALTER COLUMN username DROP NOT NULL;
        `);
      } catch (err) {
        // Columns room/username may not exist in fresh installs
      }
      break;
    } catch (err) {
      if (attempt >= 15) throw err;
      console.error(`database not ready (attempt ${attempt}/15): ${err.message}`);
      await sleep(2000);
    }
  }
}

/* ------------------------------------------------------------- auth & crypto */

function sanitizePhone(phone) {
  if (typeof phone !== 'string') return '';
  const cleaned = phone.trim().replace(/[^\d+]/g, '');
  if (!cleaned) return '';
  return cleaned;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!password || !stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  try {
    const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(testHash, 'hex'));
  } catch (err) {
    return false;
  }
}

function generateToken(userId) {
  const payload = `${userId}:${Date.now()}`;
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

function parseToken(token) {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const [userId, ts, sig] = raw.split(':');
    if (!userId || !ts || !sig) return null;
    const payload = `${userId}:${ts}`;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
    if (sig !== expectedSig) return null;
    return Number(userId);
  } catch (err) {
    return null;
  }
}

async function getUserById(id) {
  if (!id) return null;
  const { rows } = await pool.query(
    'SELECT id, phone, name, avatar_color, avatar_url, is_admin, is_suspended, created_at FROM chat_users WHERE id = $1',
    [id]
  );
  if (!rows.length) return null;
  const user = rows[0];
  user.id = Number(user.id);
  return user;
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers.cookie) {
    const match = req.headers.cookie.match(/chatbox_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    return res.status(401).json({ ok: false, error: 'Authentication required' });
  }

  const userId = parseToken(token);
  if (!userId) {
    return res.status(401).json({ ok: false, error: 'Invalid or expired session' });
  }

  const user = await getUserById(userId);
  if (!user) {
    return res.status(401).json({ ok: false, error: 'User no longer exists' });
  }

  if (user.is_suspended) {
    return res.status(403).json({ ok: false, error: 'Your account has been suspended by an administrator.' });
  }

  req.user = user;
  next();
}

function adminMiddleware(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ ok: false, error: 'Administrator access required' });
  }
  next();
}

/* ------------------------------------------------------------- media upload */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    const unique = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const mime = file.mimetype.toLowerCase();
    const isImage = mime.startsWith('image/');
    const isVideo = mime.startsWith('video/');
    const isAudio = mime.startsWith('audio/') || mime.includes('webm') || mime.includes('ogg') || mime.includes('wav') || mime.includes('mp4');
    if (isImage || isVideo || isAudio) {
      cb(null, true);
    } else {
      cb(new Error('Only photo, video, and audio files are supported.'));
    }
  },
});

/* -------------------------------------------------------------------- http */

const ASSET_VERSION = String(Date.now());
const indexHtml = fs
  .readFileSync(path.join(__dirname, 'views', 'index.html'), 'utf8')
  .replaceAll('{{BASE}}', PREFIX)
  .replaceAll('{{VERSION}}', ASSET_VERSION);

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', true);

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "media-src 'self' data: blob:",
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

// Serve static assets and uploaded media
app.use('/static/uploads', express.static(UPLOADS_DIR, { index: false, maxAge: '30d' }));
app.use('/static', express.static(path.join(__dirname, 'public'), { index: false, maxAge: '7d' }));

/* --------------------------------------------------------------- API routes */

// Healthcheck
app.get('/healthz', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: true, uptime: Math.round(process.uptime()) });
  } catch (err) {
    res.status(503).json({ ok: false, db: false });
  }
});

// Auth: Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const phone = sanitizePhone(req.body.phone);
    const password = String(req.body.password || '');

    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({ ok: false, error: 'Name must be between 2 and 50 characters.' });
    }
    if (phone.length < 7 || phone.length > 16) {
      return res.status(400).json({ ok: false, error: 'Please enter a valid phone number (7-16 digits).' });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 6 characters.' });
    }

    const existing = await pool.query('SELECT id FROM chat_users WHERE phone = $1', [phone]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ ok: false, error: 'An account with this phone number already exists.' });
    }

    // Determine admin status: first user or matches ADMIN_PHONE
    const userCountRes = await pool.query('SELECT count(*)::int as count FROM chat_users');
    const isFirstUser = userCountRes.rows[0].count === 0;
    const matchesAdminPhone = ADMIN_PHONE && phone === sanitizePhone(ADMIN_PHONE);
    const isAdmin = Boolean(isFirstUser || matchesAdminPhone);

    const hash = hashPassword(password);
    const avatarColor = Math.floor(Math.random() * 10);

    const insertRes = await pool.query(
      `INSERT INTO chat_users (phone, name, password_hash, avatar_color, is_admin)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, phone, name, avatar_color, is_admin, created_at`,
      [phone, name, hash, avatarColor, isAdmin]
    );

    const user = insertRes.rows[0];
    user.id = Number(user.id);
    const token = generateToken(user.id);

    res.json({ ok: true, user, token });
  } catch (err) {
    console.error('Registration failed:', err);
    res.status(500).json({ ok: false, error: 'Registration failed. Try again.' });
  }
});

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const phone = sanitizePhone(req.body.phone);
    const password = String(req.body.password || '');

    if (!phone || !password) {
      return res.status(400).json({ ok: false, error: 'Phone number and password are required.' });
    }

    const { rows } = await pool.query(
      'SELECT id, phone, name, password_hash, avatar_color, is_admin, is_suspended, created_at FROM chat_users WHERE phone = $1',
      [phone]
    );

    if (!rows.length || !verifyPassword(password, rows[0].password_hash)) {
      return res.status(401).json({ ok: false, error: 'Incorrect phone number or password.' });
    }

    const user = rows[0];
    user.id = Number(user.id);

    if (user.is_suspended) {
      return res.status(403).json({ ok: false, error: 'Your account has been suspended by an administrator.' });
    }

    delete user.password_hash;
    const token = generateToken(user.id);

    res.json({ ok: true, user, token });
  } catch (err) {
    console.error('Login failed:', err);
    res.status(500).json({ ok: false, error: 'Login failed. Try again.' });
  }
});

// Auth: Me
app.get('/api/auth/me', authMiddleware, (req, res) => {
  res.json({ ok: true, user: req.user });
});

// Check friendship helper
async function areFriends(userId1, userId2) {
  if (!userId1 || !userId2) return false;
  const { rows } = await pool.query(
    'SELECT 1 FROM chat_friends WHERE user_id = $1 AND friend_id = $2',
    [userId1, userId2]
  );
  return rows.length > 0;
}

// Profile: Update current user's profile
app.post('/api/profile', authMiddleware, async (req, res) => {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : null;
    const avatarColor = typeof req.body.avatarColor === 'number' ? req.body.avatarColor : null;
    const avatarUrl = typeof req.body.avatarUrl === 'string' ? req.body.avatarUrl.trim() : (req.body.avatarUrl === null ? null : undefined);
    const password = typeof req.body.password === 'string' ? req.body.password : null;

    if (name !== null) {
      if (name.length < 2 || name.length > 50) {
        return res.status(400).json({ ok: false, error: 'Name must be between 2 and 50 characters.' });
      }
      await pool.query('UPDATE chat_users SET name = $1 WHERE id = $2', [name, req.user.id]);
    }

    if (avatarColor !== null && avatarColor >= 0 && avatarColor <= 9) {
      await pool.query('UPDATE chat_users SET avatar_color = $1 WHERE id = $2', [avatarColor, req.user.id]);
    }

    if (avatarUrl !== undefined) {
      await pool.query('UPDATE chat_users SET avatar_url = $1 WHERE id = $2', [avatarUrl, req.user.id]);
    }

    if (password && password.length >= 6) {
      const hash = hashPassword(password);
      await pool.query('UPDATE chat_users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    }

    const updatedUser = await getUserById(req.user.id);
    io.emit('user_profile_updated', {
      userId: req.user.id,
      name: updatedUser.name,
      avatarColor: updatedUser.avatar_color,
      avatarUrl: updatedUser.avatar_url,
    });

    res.json({ ok: true, user: updatedUser });
  } catch (err) {
    console.error('Update profile failed:', err);
    res.status(500).json({ ok: false, error: 'Could not update profile.' });
  }
});

// Friends: List
app.get('/api/friends', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.phone, u.name, u.avatar_color, u.avatar_url, u.is_suspended
       FROM chat_friends f
       JOIN chat_users u ON f.friend_id = u.id
       WHERE f.user_id = $1
       ORDER BY u.name ASC`,
      [req.user.id]
    );

    const friends = rows.map((u) => ({
      id: Number(u.id),
      phone: u.phone,
      name: u.name,
      avatarColor: u.avatar_color,
      avatarUrl: u.avatar_url,
      isOnline: onlineUsers.has(Number(u.id)),
    }));

    res.json({ ok: true, friends });
  } catch (err) {
    console.error('Fetch friends failed:', err);
    res.status(500).json({ ok: false, error: 'Could not load friends.' });
  }
});

// Friends: Add by phone (Mutual friendship for instant connect & test compatibility)
app.post('/api/friends/add', authMiddleware, async (req, res) => {
  try {
    const phone = sanitizePhone(req.body.phone);
    if (!phone) {
      return res.status(400).json({ ok: false, error: 'Please enter a valid phone number.' });
    }

    if (phone === req.user.phone) {
      return res.status(400).json({ ok: false, error: 'You cannot add yourself as a friend.' });
    }

    const { rows } = await pool.query(
      'SELECT id, phone, name, avatar_color, avatar_url, is_suspended FROM chat_users WHERE phone = $1',
      [phone]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, error: 'No user registered with this phone number.' });
    }

    const friend = rows[0];
    friend.id = Number(friend.id);

    // Mutual friendship
    await pool.query(
      'INSERT INTO chat_friends (user_id, friend_id) VALUES ($1, $2), ($2, $1) ON CONFLICT DO NOTHING',
      [req.user.id, friend.id]
    );

    // Also mark any friend requests between them as accepted
    await pool.query(
      `UPDATE chat_friend_requests SET status = 'accepted', updated_at = now()
       WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)`,
      [req.user.id, friend.id]
    );

    res.json({
      ok: true,
      friend: {
        id: friend.id,
        phone: friend.phone,
        name: friend.name,
        avatarColor: friend.avatar_color,
        avatarUrl: friend.avatar_url,
        isOnline: onlineUsers.has(friend.id),
      },
    });
  } catch (err) {
    console.error('Add friend failed:', err);
    res.status(500).json({ ok: false, error: 'Could not add friend.' });
  }
});

// Friend Requests: Send request
app.post('/api/friends/request', authMiddleware, async (req, res) => {
  try {
    const phone = sanitizePhone(req.body.phone);
    if (!phone) return res.status(400).json({ ok: false, error: 'Please enter a valid phone number.' });
    if (phone === req.user.phone) return res.status(400).json({ ok: false, error: 'You cannot send a friend request to yourself.' });

    const { rows } = await pool.query(
      'SELECT id, phone, name, avatar_color, avatar_url FROM chat_users WHERE phone = $1',
      [phone]
    );
    if (!rows.length) return res.status(404).json({ ok: false, error: 'No user registered with this phone number.' });

    const targetUser = rows[0];
    const targetId = Number(targetUser.id);

    // Check if already friends
    const isFriend = await areFriends(req.user.id, targetId);
    if (isFriend) return res.status(400).json({ ok: false, error: 'You are already friends with this user.' });

    // Check if reverse request exists and is pending -> auto accept!
    const reverseReq = await pool.query(
      "SELECT id FROM chat_friend_requests WHERE sender_id = $1 AND receiver_id = $2 AND status = 'pending'",
      [targetId, req.user.id]
    );
    if (reverseReq.rows.length) {
      await pool.query("UPDATE chat_friend_requests SET status = 'accepted', updated_at = now() WHERE id = $1", [reverseReq.rows[0].id]);
      await pool.query(
        'INSERT INTO chat_friends (user_id, friend_id) VALUES ($1, $2), ($2, $1) ON CONFLICT DO NOTHING',
        [req.user.id, targetId]
      );
      io.to(`u:${targetId}`).emit('friend_request_accepted', {
        friend: { id: req.user.id, name: req.user.name, phone: req.user.phone, avatarColor: req.user.avatar_color, avatarUrl: req.user.avatar_url }
      });
      return res.json({ ok: true, status: 'accepted', message: `You and ${targetUser.name} are now friends!` });
    }

    // Insert or update pending request
    await pool.query(
      `INSERT INTO chat_friend_requests (sender_id, receiver_id, status, updated_at)
       VALUES ($1, $2, 'pending', now())
       ON CONFLICT (sender_id, receiver_id)
       DO UPDATE SET status = 'pending', updated_at = now()`,
      [req.user.id, targetId]
    );

    io.to(`u:${targetId}`).emit('friend_request_received', {
      sender: {
        id: req.user.id,
        name: req.user.name,
        phone: req.user.phone,
        avatarColor: req.user.avatar_color,
        avatarUrl: req.user.avatar_url,
      }
    });

    res.json({ ok: true, status: 'pending', message: 'Friend request sent successfully.' });
  } catch (err) {
    console.error('Send friend request failed:', err);
    res.status(500).json({ ok: false, error: 'Could not send friend request.' });
  }
});

// Friend Requests: List incoming pending requests
app.get('/api/friends/requests', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT r.id, r.sender_id, r.created_at, u.name, u.phone, u.avatar_color, u.avatar_url
       FROM chat_friend_requests r
       JOIN chat_users u ON r.sender_id = u.id
       WHERE r.receiver_id = $1 AND r.status = 'pending'
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    const requests = rows.map((r) => ({
      id: Number(r.id),
      senderId: Number(r.sender_id),
      name: r.name,
      phone: r.phone,
      avatarColor: r.avatar_color,
      avatarUrl: r.avatar_url,
      createdAt: new Date(r.created_at).getTime(),
    }));

    res.json({ ok: true, requests });
  } catch (err) {
    console.error('Fetch friend requests failed:', err);
    res.status(500).json({ ok: false, error: 'Could not load friend requests.' });
  }
});

// Friend Requests: Accept
app.post('/api/friends/requests/:id/accept', authMiddleware, async (req, res) => {
  try {
    const reqId = Number(req.params.id);
    const { rows } = await pool.query(
      "SELECT sender_id, receiver_id FROM chat_friend_requests WHERE id = $1 AND receiver_id = $2 AND status = 'pending'",
      [reqId, req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ ok: false, error: 'Friend request not found or already handled.' });
    }

    const senderId = Number(rows[0].sender_id);
    await pool.query("UPDATE chat_friend_requests SET status = 'accepted', updated_at = now() WHERE id = $1", [reqId]);
    await pool.query(
      'INSERT INTO chat_friends (user_id, friend_id) VALUES ($1, $2), ($2, $1) ON CONFLICT DO NOTHING',
      [req.user.id, senderId]
    );

    const sender = await getUserById(senderId);
    io.to(`u:${senderId}`).emit('friend_request_accepted', {
      friend: { id: req.user.id, name: req.user.name, phone: req.user.phone, avatarColor: req.user.avatar_color, avatarUrl: req.user.avatar_url }
    });

    res.json({
      ok: true,
      friend: {
        id: senderId,
        name: sender ? sender.name : 'Friend',
        phone: sender ? sender.phone : '',
        avatarColor: sender ? sender.avatar_color : 0,
        avatarUrl: sender ? sender.avatar_url : null,
      }
    });
  } catch (err) {
    console.error('Accept friend request failed:', err);
    res.status(500).json({ ok: false, error: 'Could not accept friend request.' });
  }
});

// Friend Requests: Decline
app.post('/api/friends/requests/:id/decline', authMiddleware, async (req, res) => {
  try {
    const reqId = Number(req.params.id);
    await pool.query(
      "UPDATE chat_friend_requests SET status = 'declined', updated_at = now() WHERE id = $1 AND receiver_id = $2",
      [reqId, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('Decline friend request failed:', err);
    res.status(500).json({ ok: false, error: 'Could not decline friend request.' });
  }
});

// Conversations: List for current user
app.get('/api/conversations', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.id, c.type, c.name, c.created_at, c.updated_at, m.cleared_at, m.is_hidden
       FROM chat_conversations c
       JOIN chat_conversation_members m ON c.id = m.conversation_id
       WHERE m.user_id = $1
       ORDER BY c.updated_at DESC`,
      [req.user.id]
    );

    const conversations = [];
    for (const conv of rows) {
      const convId = Number(conv.id);
      const isHidden = Boolean(conv.is_hidden);
      const clearedAt = conv.cleared_at ? new Date(conv.cleared_at) : null;

      // Latest message for this user (only after cleared_at)
      let lastMsgRes;
      if (clearedAt) {
        lastMsgRes = await pool.query(
          `SELECT body, media_type, sender_name, created_at, is_deleted
           FROM chat_messages
           WHERE conversation_id = $1 AND is_deleted = FALSE AND created_at > $2
           ORDER BY id DESC LIMIT 1`,
          [convId, clearedAt]
        );
      } else {
        lastMsgRes = await pool.query(
          `SELECT body, media_type, sender_name, created_at, is_deleted
           FROM chat_messages
           WHERE conversation_id = $1 AND is_deleted = FALSE
           ORDER BY id DESC LIMIT 1`,
          [convId]
        );
      }

      // If hidden and no new messages arrived after cleared_at, omit from list
      if (isHidden && !lastMsgRes.rows.length) {
        continue;
      }

      let displayName = conv.name;
      let displayPhone = null;
      let otherUserId = null;
      let avatarColor = 0;
      let avatarUrl = null;
      let isOnline = false;

      if (conv.type === 'direct') {
        const otherRes = await pool.query(
          `SELECT u.id, u.name, u.phone, u.avatar_color, u.avatar_url
           FROM chat_conversation_members m
           JOIN chat_users u ON m.user_id = u.id
           WHERE m.conversation_id = $1 AND m.user_id != $2
           LIMIT 1`,
          [convId, req.user.id]
        );
        if (otherRes.rows.length) {
          const other = otherRes.rows[0];
          otherUserId = Number(other.id);
          displayName = other.name;
          displayPhone = other.phone;
          avatarColor = other.avatar_color;
          avatarUrl = other.avatar_url;
          isOnline = onlineUsers.has(otherUserId);
        } else {
          displayName = 'Direct Chat';
        }
      }

      // Member count
      const countRes = await pool.query(
        'SELECT count(*)::int as count FROM chat_conversation_members WHERE conversation_id = $1',
        [convId]
      );
      const memberCount = countRes.rows[0].count;

      const lastMessage = lastMsgRes.rows.length
        ? {
            text: lastMsgRes.rows[0].media_type ? `[${lastMsgRes.rows[0].media_type}]` : lastMsgRes.rows[0].body,
            senderName: lastMsgRes.rows[0].sender_name,
            ts: new Date(lastMsgRes.rows[0].created_at).getTime(),
          }
        : null;

      conversations.push({
        id: convId,
        type: conv.type,
        name: displayName,
        phone: displayPhone,
        otherUserId,
        avatarColor,
        avatarUrl,
        memberCount,
        isOnline,
        lastMessage,
        updatedAt: new Date(conv.updated_at).getTime(),
      });
    }

    res.json({ ok: true, conversations });
  } catch (err) {
    console.error('Fetch conversations failed:', err);
    res.status(500).json({ ok: false, error: 'Could not load conversations.' });
  }
});

// Conversations: Start or open Direct Chat (Non-friends cannot talk)
app.post('/api/conversations/direct', authMiddleware, async (req, res) => {
  try {
    const phone = sanitizePhone(req.body.phone);
    if (!phone) return res.status(400).json({ ok: false, error: 'Valid phone number required.' });

    if (phone === req.user.phone) {
      return res.status(400).json({ ok: false, error: 'Cannot start a direct chat with yourself.' });
    }

    const userRes = await pool.query(
      'SELECT id, name, phone, avatar_color, avatar_url, is_suspended FROM chat_users WHERE phone = $1',
      [phone]
    );
    if (!userRes.rows.length) {
      return res.status(404).json({ ok: false, error: 'No user registered with this phone number.' });
    }

    const otherUser = userRes.rows[0];
    const otherId = Number(otherUser.id);

    // Friend check: Non-friends cannot talk
    const isFriend = await areFriends(req.user.id, otherId);
    if (!isFriend) {
      return res.status(403).json({
        ok: false,
        error: 'You must be friends to start a direct chat. Send a friend request first.',
        requiresFriendRequest: true,
        user: { id: otherId, name: otherUser.name, phone: otherUser.phone, avatarColor: otherUser.avatar_color, avatarUrl: otherUser.avatar_url }
      });
    }

    // Check if direct conversation already exists
    const existingRes = await pool.query(
      `SELECT c.id
       FROM chat_conversations c
       JOIN chat_conversation_members m1 ON c.id = m1.conversation_id AND m1.user_id = $1
       JOIN chat_conversation_members m2 ON c.id = m2.conversation_id AND m2.user_id = $2
       WHERE c.type = 'direct'
       LIMIT 1`,
      [req.user.id, otherId]
    );

    let convId;
    if (existingRes.rows.length > 0) {
      convId = Number(existingRes.rows[0].id);
      // Unhide for current user if it was previously deleted/hidden
      await pool.query('UPDATE chat_conversation_members SET is_hidden = FALSE WHERE conversation_id = $1 AND user_id = $2', [convId, req.user.id]);
    } else {
      const createRes = await pool.query(
        "INSERT INTO chat_conversations (type, created_by) VALUES ('direct', $1) RETURNING id",
        [req.user.id]
      );
      convId = Number(createRes.rows[0].id);
      await pool.query(
        'INSERT INTO chat_conversation_members (conversation_id, user_id, role) VALUES ($1, $2, $3), ($1, $4, $5)',
        [convId, req.user.id, 'member', otherId, 'member']
      );
    }

    res.json({
      ok: true,
      conversation: {
        id: convId,
        type: 'direct',
        name: otherUser.name,
        phone: otherUser.phone,
        otherUserId: otherId,
        avatarColor: otherUser.avatar_color,
        avatarUrl: otherUser.avatar_url,
        isOnline: onlineUsers.has(otherId),
      },
    });
  } catch (err) {
    console.error('Direct chat failed:', err);
    res.status(500).json({ ok: false, error: 'Could not create direct chat.' });
  }
});

// Conversations: Delete conversation for current user only ("Delete for me")
app.delete('/api/conversations/:id', authMiddleware, async (req, res) => {
  try {
    const convId = Number(req.params.id);
    const memberCheck = await pool.query(
      'SELECT 1 FROM chat_conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [convId, req.user.id]
    );
    if (!memberCheck.rows.length) {
      return res.status(403).json({ ok: false, error: 'You are not a member of this conversation.' });
    }

    // Set cleared_at and is_hidden for THIS user only. Other member(s) unaffected!
    await pool.query(
      'UPDATE chat_conversation_members SET cleared_at = now(), is_hidden = TRUE WHERE conversation_id = $1 AND user_id = $2',
      [convId, req.user.id]
    );

    res.json({ ok: true, conversationId: convId });
  } catch (err) {
    console.error('Delete conversation error:', err);
    res.status(500).json({ ok: false, error: 'Could not delete conversation.' });
  }
});

// Conversations: Create Group Chat
app.post('/api/conversations/group', authMiddleware, async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const phones = Array.isArray(req.body.phones) ? req.body.phones : [];

    if (name.length < 2 || name.length > 40) {
      return res.status(400).json({ ok: false, error: 'Group name must be between 2 and 40 characters.' });
    }

    const createRes = await pool.query(
      "INSERT INTO chat_conversations (type, name, created_by) VALUES ('group', $1, $2) RETURNING id, name, created_at",
      [name, req.user.id]
    );
    const convId = Number(createRes.rows[0].id);

    // Add creator as admin
    await pool.query(
      "INSERT INTO chat_conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'admin')",
      [convId, req.user.id]
    );

    // Add member phones
    for (const rawPhone of phones) {
      const clean = sanitizePhone(rawPhone);
      if (!clean || clean === req.user.phone) continue;
      const uRes = await pool.query('SELECT id FROM chat_users WHERE phone = $1', [clean]);
      if (uRes.rows.length) {
        await pool.query(
          "INSERT INTO chat_conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING",
          [convId, Number(uRes.rows[0].id)]
        );
      }
    }

    // Post system message
    await pool.query(
      'INSERT INTO chat_messages (conversation_id, sender_id, sender_name, body) VALUES ($1, $2, $3, $4)',
      [convId, req.user.id, 'System', `${req.user.name} created group "${name}"`]
    );

    // Notify online users via socket
    io.emit('conversation_created', { conversationId: convId });

    res.json({
      ok: true,
      conversation: {
        id: convId,
        type: 'group',
        name,
        created_by: req.user.id,
      },
    });
  } catch (err) {
    console.error('Create group failed:', err);
    res.status(500).json({ ok: false, error: 'Could not create group chat.' });
  }
});

// Conversations: Add Member to Group
app.post('/api/conversations/:id/members', authMiddleware, async (req, res) => {
  try {
    const convId = Number(req.params.id);
    const phone = sanitizePhone(req.body.phone);

    if (!phone) return res.status(400).json({ ok: false, error: 'Valid phone number required.' });

    // Check if requester is a member of the group
    const memberCheck = await pool.query(
      'SELECT role FROM chat_conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [convId, req.user.id]
    );
    if (!memberCheck.rows.length) {
      return res.status(403).json({ ok: false, error: 'You are not a member of this conversation.' });
    }

    const userRes = await pool.query(
      'SELECT id, name, phone, avatar_color FROM chat_users WHERE phone = $1',
      [phone]
    );
    if (!userRes.rows.length) {
      return res.status(404).json({ ok: false, error: 'No user registered with this phone number.' });
    }

    const newUser = userRes.rows[0];
    const newUserId = Number(newUser.id);

    const alreadyMember = await pool.query(
      'SELECT user_id FROM chat_conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [convId, newUserId]
    );
    if (alreadyMember.rows.length) {
      return res.status(400).json({ ok: false, error: 'User is already a member of this group.' });
    }

    await pool.query(
      "INSERT INTO chat_conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'member')",
      [convId, newUserId]
    );

    // System message
    const sysMsgRes = await pool.query(
      'INSERT INTO chat_messages (conversation_id, sender_id, sender_name, body) VALUES ($1, $2, $3, $4) RETURNING id, created_at',
      [convId, req.user.id, 'System', `${req.user.name} added ${newUser.name} to the group`]
    );

    io.to(`c:${convId}`).emit('message', {
      id: Number(sysMsgRes.rows[0].id),
      conversationId: convId,
      senderId: req.user.id,
      senderName: 'System',
      text: `${req.user.name} added ${newUser.name} to the group`,
      ts: new Date(sysMsgRes.rows[0].created_at).getTime(),
      isSystem: true,
    });

    // Notify the added user directly to refresh their list
    io.to(`u:${newUserId}`).emit('conversation_added', { conversationId: convId });

    res.json({ ok: true, addedUser: { id: newUserId, name: newUser.name, phone: newUser.phone } });
  } catch (err) {
    console.error('Add member failed:', err);
    res.status(500).json({ ok: false, error: 'Could not add member.' });
  }
});

// Conversations: Get Members
app.get('/api/conversations/:id/members', authMiddleware, async (req, res) => {
  try {
    const convId = Number(req.params.id);
    const { rows } = await pool.query(
      `SELECT u.id, u.name, u.phone, u.avatar_color, m.role, m.joined_at
       FROM chat_conversation_members m
       JOIN chat_users u ON m.user_id = u.id
       WHERE m.conversation_id = $1
       ORDER BY m.role DESC, u.name ASC`,
      [convId]
    );

    const members = rows.map((u) => ({
      id: Number(u.id),
      name: u.name,
      phone: u.phone,
      avatarColor: u.avatar_color,
      role: u.role,
      isOnline: onlineUsers.has(Number(u.id)),
    }));

    res.json({ ok: true, members });
  } catch (err) {
    console.error('Get members failed:', err);
    res.status(500).json({ ok: false, error: 'Could not load group members.' });
  }
});

// Messages: Load History for Conversation (filtered by user's cleared_at)
app.get('/api/conversations/:id/messages', authMiddleware, async (req, res) => {
  try {
    const convId = Number(req.params.id);

    // Verify membership and fetch cleared_at
    const memberCheck = await pool.query(
      'SELECT cleared_at FROM chat_conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [convId, req.user.id]
    );
    if (!memberCheck.rows.length) {
      return res.status(403).json({ ok: false, error: 'You are not a member of this conversation.' });
    }

    const clearedAt = memberCheck.rows[0].cleared_at ? new Date(memberCheck.rows[0].cleared_at) : null;
    let rows;
    if (clearedAt) {
      const q = await pool.query(
        `SELECT id, conversation_id, sender_id, sender_name, body, media_url, media_type, media_name, created_at
         FROM chat_messages
         WHERE conversation_id = $1 AND is_deleted = FALSE AND created_at > $2
         ORDER BY id DESC LIMIT 100`,
        [convId, clearedAt]
      );
      rows = q.rows;
    } else {
      const q = await pool.query(
        `SELECT id, conversation_id, sender_id, sender_name, body, media_url, media_type, media_name, created_at
         FROM chat_messages
         WHERE conversation_id = $1 AND is_deleted = FALSE
         ORDER BY id DESC LIMIT 100`,
        [convId]
      );
      rows = q.rows;
    }

    const messages = rows
      .map((r) => ({
        id: Number(r.id),
        conversationId: Number(r.conversation_id),
        senderId: Number(r.sender_id),
        senderName: r.sender_name,
        text: r.body,
        mediaUrl: r.media_url,
        mediaType: r.media_type,
        mediaName: r.media_name,
        ts: new Date(r.created_at).getTime(),
      }))
      .reverse();

    res.json({ ok: true, messages });
  } catch (err) {
    console.error('Load messages failed:', err);
    res.status(500).json({ ok: false, error: 'Could not load messages.' });
  }
});

// Media: Upload Photo / Video / Audio (Voice Message)
app.post('/api/upload', authMiddleware, upload.single('media'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No media file provided.' });
  }

  const mime = req.file.mimetype.toLowerCase();
  const isVideo = mime.startsWith('video/');
  const isAudio =
    mime.startsWith('audio/') ||
    mime.includes('webm') ||
    mime.includes('ogg') ||
    mime.includes('wav') ||
    req.file.originalname.endsWith('.webm') ||
    req.file.originalname.endsWith('.ogg') ||
    req.file.originalname.endsWith('.wav') ||
    req.file.originalname.endsWith('.mp3');

  let mediaType = 'image';
  if (isVideo) mediaType = 'video';
  if (isAudio) mediaType = 'audio';
  const url = `${PREFIX}/static/uploads/${req.file.filename}`;

  res.json({
    ok: true,
    url,
    mediaType,
    mediaName: req.file.originalname,
    size: req.file.size,
  });
});

// Messages: Soft Delete
app.delete('/api/messages/:id', authMiddleware, async (req, res) => {
  try {
    const msgId = Number(req.params.id);
    const { rows } = await pool.query(
      'SELECT id, conversation_id, sender_id, is_deleted FROM chat_messages WHERE id = $1',
      [msgId]
    );

    if (!rows.length) {
      return res.status(404).json({ ok: false, error: 'Message not found.' });
    }

    const msg = rows[0];
    const isOwner = Number(msg.sender_id) === req.user.id;
    if (!isOwner && !req.user.is_admin) {
      return res.status(403).json({ ok: false, error: 'You can only delete your own messages.' });
    }

    // Soft delete: marks is_deleted = TRUE (Preserved for admin audit!)
    await pool.query('UPDATE chat_messages SET is_deleted = TRUE WHERE id = $1', [msgId]);

    // Broadcast deletion in real time to conversation
    io.to(`c:${msg.conversation_id}`).emit('message_deleted', {
      id: msgId,
      conversationId: Number(msg.conversation_id),
    });

    res.json({ ok: true, id: msgId });
  } catch (err) {
    console.error('Delete message failed:', err);
    res.status(500).json({ ok: false, error: 'Could not delete message.' });
  }
});

/* ------------------------------------------------------------- Admin routes */

// Admin: Stats
app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const usersRes = await pool.query('SELECT count(*)::int as count FROM chat_users');
    const messagesRes = await pool.query('SELECT count(*)::int as count FROM chat_messages');
    const deletedRes = await pool.query('SELECT count(*)::int as count FROM chat_messages WHERE is_deleted = TRUE');
    const groupsRes = await pool.query("SELECT count(*)::int as count FROM chat_conversations WHERE type = 'group'");
    const directsRes = await pool.query("SELECT count(*)::int as count FROM chat_conversations WHERE type = 'direct'");

    res.json({
      ok: true,
      stats: {
        totalUsers: usersRes.rows[0].count,
        activeUsersOnline: onlineUsers.size,
        totalMessages: messagesRes.rows[0].count,
        deletedMessages: deletedRes.rows[0].count,
        totalGroups: groupsRes.rows[0].count,
        totalDirectChats: directsRes.rows[0].count,
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ ok: false, error: 'Could not load admin stats.' });
  }
});

// Admin: List all registered users
app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.phone, u.name, u.avatar_color, u.is_admin, u.is_suspended, u.created_at,
             count(m.id)::int as message_count
      FROM chat_users u
      LEFT JOIN chat_messages m ON u.id = m.sender_id
      GROUP BY u.id
      ORDER BY u.id DESC
    `);

    const users = rows.map((u) => ({
      id: Number(u.id),
      phone: u.phone,
      name: u.name,
      avatarColor: u.avatar_color,
      isAdmin: u.is_admin,
      isSuspended: u.is_suspended,
      messageCount: u.message_count,
      isOnline: onlineUsers.has(Number(u.id)),
      createdAt: new Date(u.created_at).getTime(),
    }));

    res.json({ ok: true, users });
  } catch (err) {
    console.error('Admin list users error:', err);
    res.status(500).json({ ok: false, error: 'Could not load users.' });
  }
});

// Admin: Block / Suspend / Unsuspend user
app.post('/api/admin/users/:id/suspend', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const suspend = Boolean(req.body.suspend);

    if (targetId === req.user.id) {
      return res.status(400).json({ ok: false, error: 'You cannot suspend your own account.' });
    }

    await pool.query('UPDATE chat_users SET is_suspended = $1 WHERE id = $2', [suspend, targetId]);

    if (suspend) {
      // Disconnect any active sockets for this user immediately
      for (const [socketId, socket] of io.sockets.sockets) {
        if (socket.user && socket.user.id === targetId) {
          socket.emit('account_suspended');
          socket.disconnect(true);
        }
      }
      onlineUsers.delete(targetId);
    }

    res.json({ ok: true, targetId, suspended: suspend });
  } catch (err) {
    console.error('Admin suspend error:', err);
    res.status(500).json({ ok: false, error: 'Could not change user status.' });
  }
});

// Admin: List all conversations for audit
app.get('/api/admin/conversations', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.id, c.type, c.name, c.created_at, c.updated_at,
             count(DISTINCT m.user_id)::int as member_count,
             count(msg.id)::int as total_messages,
             count(CASE WHEN msg.is_deleted = TRUE THEN 1 END)::int as deleted_messages
      FROM chat_conversations c
      LEFT JOIN chat_conversation_members m ON c.id = m.conversation_id
      LEFT JOIN chat_messages msg ON c.id = msg.conversation_id
      GROUP BY c.id
      ORDER BY c.updated_at DESC
    `);

    const conversations = rows.map((c) => ({
      id: Number(c.id),
      type: c.type,
      name: c.name || `Direct Chat #${c.id}`,
      memberCount: c.member_count,
      totalMessages: c.total_messages,
      deletedMessages: c.deleted_messages,
      updatedAt: new Date(c.updated_at).getTime(),
    }));

    res.json({ ok: true, conversations });
  } catch (err) {
    console.error('Admin conversations error:', err);
    res.status(500).json({ ok: false, error: 'Could not load conversations.' });
  }
});

// Admin: Full conversation audit log (includes all messages even if deleted by users!)
app.get('/api/admin/conversations/:id/audit', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const convId = Number(req.params.id);
    const { rows } = await pool.query(
      `SELECT m.id, m.conversation_id, m.sender_id, m.sender_name, u.phone as sender_phone,
              m.body, m.media_url, m.media_type, m.media_name, m.is_deleted, m.created_at
       FROM chat_messages m
       LEFT JOIN chat_users u ON m.sender_id = u.id
       WHERE m.conversation_id = $1
       ORDER BY m.id ASC`,
      [convId]
    );

    const messages = rows.map((r) => ({
      id: Number(r.id),
      conversationId: Number(r.conversation_id),
      senderId: Number(r.sender_id),
      senderName: r.sender_name,
      senderPhone: r.sender_phone,
      text: r.body,
      mediaUrl: r.media_url,
      mediaType: r.media_type,
      mediaName: r.media_name,
      isDeleted: Boolean(r.is_deleted),
      ts: new Date(r.created_at).getTime(),
    }));

    res.json({ ok: true, messages });
  } catch (err) {
    console.error('Admin audit log error:', err);
    res.status(500).json({ ok: false, error: 'Could not load audit log.' });
  }
});

// Page HTML
app.get('/', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.type('html').send(indexHtml);
});

app.use((req, res) => res.status(404).type('text').send('Not found'));

const server = http.createServer(app);
server.keepAliveTimeout = 120_000;
server.headersTimeout = 121_000;

/* ---------------------------------------------------------------- realtime */

const io = new Server(server, {
  path: '/socket.io',
  maxHttpBufferSize: 16 * 1024 * 1024, // 16MB for live packets
  pingInterval: 25_000,
  pingTimeout: 20_000,
  connectTimeout: 15_000,
});

// Subpath stripper middleware for Traefik proxy compatibility
function stripPrefix(req) {
  if (!PREFIX) return;
  const url = req.url || '/';
  if (url === PREFIX) req.url = '/';
  else if (url.startsWith(PREFIX + '/')) req.url = url.slice(PREFIX.length);
  else if (url.startsWith(PREFIX + '?')) req.url = '/' + url.slice(PREFIX.length);
}
server.prependListener('request', stripPrefix);
server.prependListener('upgrade', stripPrefix);

const onlineUsers = new Set(); // Set of userIds currently online

// Socket authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication token required'));

  const userId = parseToken(token);
  if (!userId) return next(new Error('Invalid token'));

  const user = await getUserById(userId);
  if (!user) return next(new Error('User not found'));
  if (user.is_suspended) return next(new Error('Account suspended'));

  socket.user = user;
  next();
});

io.on('connection', async (socket) => {
  const user = socket.user;
  onlineUsers.add(user.id);

  // Private room for notifications addressed to this user
  socket.join(`u:${user.id}`);
  io.emit('user_status', { userId: user.id, isOnline: true });

  // Join all conversation rooms the user is already part of
  try {
    const { rows } = await pool.query(
      'SELECT conversation_id FROM chat_conversation_members WHERE user_id = $1',
      [user.id]
    );
    for (const r of rows) {
      socket.join(`c:${r.conversation_id}`);
    }
  } catch (err) {
    console.error('Socket join rooms error:', err);
  }

  // Join a specific conversation
  socket.on('join_conversation', async ({ conversationId }, ack) => {
    const reply = typeof ack === 'function' ? ack : () => {};
    const convId = Number(conversationId);
    if (!convId) return reply({ ok: false, error: 'Invalid conversation' });

    try {
      const memberCheck = await pool.query(
        'SELECT 1 FROM chat_conversation_members WHERE conversation_id = $1 AND user_id = $2',
        [convId, user.id]
      );
      if (!memberCheck.rows.length) {
        return reply({ ok: false, error: 'Not a member of this conversation' });
      }

      socket.join(`c:${convId}`);
      reply({ ok: true });
    } catch (err) {
      reply({ ok: false, error: 'Join failed' });
    }
  });

  // Send message
  socket.on('message', async (payload, ack) => {
    const reply = typeof ack === 'function' ? ack : () => {};
    const convId = Number(payload && payload.conversationId);
    const text = String((payload && payload.text) || '').trim();
    const mediaUrl = payload && payload.mediaUrl ? String(payload.mediaUrl) : null;
    const mediaType = payload && payload.mediaType ? String(payload.mediaType) : null;
    const mediaName = payload && payload.mediaName ? String(payload.mediaName) : null;

    if (!convId) return reply({ ok: false, error: 'Invalid conversation.' });
    if (!text && !mediaUrl) return reply({ ok: false, error: 'Message cannot be empty.' });

    try {
      // Verify membership
      const memberCheck = await pool.query(
        'SELECT 1 FROM chat_conversation_members WHERE conversation_id = $1 AND user_id = $2',
        [convId, user.id]
      );
      if (!memberCheck.rows.length) {
        return reply({ ok: false, error: 'Not a member of this conversation.' });
      }

      // Check direct conversation friend permission (Non-friends cannot message)
      const convRes = await pool.query('SELECT type FROM chat_conversations WHERE id = $1', [convId]);
      if (convRes.rows.length && convRes.rows[0].type === 'direct') {
        const otherMem = await pool.query(
          'SELECT user_id FROM chat_conversation_members WHERE conversation_id = $1 AND user_id != $2 LIMIT 1',
          [convId, user.id]
        );
        if (otherMem.rows.length) {
          const otherId = Number(otherMem.rows[0].user_id);
          const isFriend = await areFriends(user.id, otherId);
          if (!isFriend) {
            return reply({ ok: false, error: 'You must be friends to exchange messages.' });
          }
        }
      }

      // Save message
      const msgRes = await pool.query(
        `INSERT INTO chat_messages (conversation_id, sender_id, sender_name, body, media_url, media_type, media_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, created_at`,
        [convId, user.id, user.name, text, mediaUrl, mediaType, mediaName]
      );

      // Unhide conversation for all members when new message arrives
      await pool.query('UPDATE chat_conversation_members SET is_hidden = FALSE WHERE conversation_id = $1', [convId]);

      const msg = {
        id: Number(msgRes.rows[0].id),
        conversationId: convId,
        senderId: user.id,
        senderName: user.name,
        text,
        mediaUrl,
        mediaType,
        mediaName,
        ts: new Date(msgRes.rows[0].created_at).getTime(),
      };

      // Update conversation updated_at
      await pool.query('UPDATE chat_conversations SET updated_at = now() WHERE id = $1', [convId]);

      // Broadcast to all sockets currently viewing this conversation room
      io.to(`c:${convId}`).emit('message', msg);

      // Also notify members' user rooms for live sidebar updates & browser notification
      const members = await pool.query(
        'SELECT user_id FROM chat_conversation_members WHERE conversation_id = $1',
        [convId]
      );
      for (const m of members.rows) {
        io.to(`u:${m.user_id}`).emit('conversation_updated', {
          conversationId: convId,
          lastMessage: {
            text: mediaType ? `[${mediaType}]` : text,
            senderName: user.name,
            ts: msg.ts,
          },
        });
      }

      reply({ ok: true, id: msg.id });
    } catch (err) {
      console.error('Socket message failed:', err);
      reply({ ok: false, error: 'Failed to send message.' });
    }
  });

  // Typing
  socket.on('typing', ({ conversationId, typing }) => {
    const convId = Number(conversationId);
    if (!convId) return;
    socket.to(`c:${convId}`).emit('typing', {
      conversationId: convId,
      userId: user.id,
      userName: user.name,
      typing: Boolean(typing),
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    onlineUsers.delete(user.id);
    io.emit('user_status', { userId: user.id, isOnline: false });
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
          console.log(
            `  database: ${
              DATABASE_URL && DATABASE_URL !== 'memory'
                ? 'postgres (connected)'
                : 'in-memory postgres (pg-mem)'
            }`
          );
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
  hashPassword,
  verifyPassword,
  generateToken,
  parseToken,
  sanitizePhone,
  PREFIX,
  PORT,
};
