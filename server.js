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
const { createSessionAuth } = require('./session');
const registerAuthRoutes = require('./routes/auth');
const registerContactRoutes = require('./routes/contacts');
const registerConversationRoutes = require('./routes/conversations');
const registerMessageRoutes = require('./routes/messages');
const registerAdminRoutes = require('./routes/admin');

let heicConvert = null;
try {
  heicConvert = require('heic-convert');
} catch (err) {
  console.warn('heic-convert not loaded:', err.message);
}

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
const SESSION_SECRET = (process.env.SESSION_SECRET || '').trim();
if (SESSION_SECRET && SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters when set.');
}
let sessionAuth = null;

function generateToken(userId) {
  if (!sessionAuth) throw new Error('Session signing is not initialized.');
  return sessionAuth.generateToken(userId);
}

function parseToken(token) {
  return sessionAuth ? sessionAuth.parseToken(token) : null;
}

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
          media_list      JSONB,
          reply_to_id     BIGINT,
          reply_to_sender TEXT,
          reply_to_text   TEXT,
          status          TEXT NOT NULL DEFAULT 'sent',
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
        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS media_list JSONB;
        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reply_to_id BIGINT;
        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reply_to_sender TEXT;
        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS reply_to_text TEXT;
        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'sent';
        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_edited BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

        -- Persistent media storage table so container redeploys never wipe out files
        CREATE TABLE IF NOT EXISTS chat_media_files (
          filename   TEXT PRIMARY KEY,
          mime_type  TEXT NOT NULL,
          data       BYTEA NOT NULL,
          size       INTEGER NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        CREATE TABLE IF NOT EXISTS chat_app_config (
          key        TEXT PRIMARY KEY,
          value      TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );

        -- Migrations for profile pic, conversation clear, and friend requests
        ALTER TABLE chat_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
        ALTER TABLE chat_users ADD COLUMN IF NOT EXISTS password_cleared BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE chat_users ADD COLUMN IF NOT EXISTS password_reset_requested BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE chat_users ADD COLUMN IF NOT EXISTS password_reset_requested_at TIMESTAMPTZ;
        ALTER TABLE chat_conversation_members ADD COLUMN IF NOT EXISTS cleared_at TIMESTAMPTZ;
        ALTER TABLE chat_conversation_members ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE chat_conversation_members ADD COLUMN IF NOT EXISTS last_read_message_id BIGINT DEFAULT 0;
        ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS avatar_url TEXT;

        CREATE TABLE IF NOT EXISTS chat_friend_requests (
          id             BIGSERIAL PRIMARY KEY,
          sender_id      BIGINT NOT NULL REFERENCES chat_users (id) ON DELETE CASCADE,
          receiver_id    BIGINT NOT NULL REFERENCES chat_users (id) ON DELETE CASCADE,
          status         TEXT NOT NULL DEFAULT 'pending',
          created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (sender_id, receiver_id)
        );

        CREATE TABLE IF NOT EXISTS chat_message_reactions (
          id              BIGSERIAL PRIMARY KEY,
          message_id      BIGINT NOT NULL REFERENCES chat_messages (id) ON DELETE CASCADE,
          user_id         BIGINT NOT NULL REFERENCES chat_users (id) ON DELETE CASCADE,
          emoji           TEXT NOT NULL,
          created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
          UNIQUE (message_id, user_id)
        );

        CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_id ON chat_messages (conversation_id, id DESC);
        CREATE INDEX IF NOT EXISTS idx_chat_conv_members_user ON chat_conversation_members (user_id);
        CREATE INDEX IF NOT EXISTS idx_chat_friends_user ON chat_friends (user_id);
        CREATE INDEX IF NOT EXISTS idx_chat_friend_requests_recv ON chat_friend_requests (receiver_id, status);
        CREATE INDEX IF NOT EXISTS idx_chat_friend_requests_sender ON chat_friend_requests (sender_id, status);
        CREATE INDEX IF NOT EXISTS idx_chat_reactions_msg ON chat_message_reactions (message_id);
      `);

      try {
        await pool.query(`
          ALTER TABLE chat_messages ALTER COLUMN room DROP NOT NULL;
          ALTER TABLE chat_messages ALTER COLUMN username DROP NOT NULL;
        `);
      } catch (err) {
        // Columns room/username may not exist in fresh installs
      }

      // Permanently clear all accumulated ("jomanu") deleted messages
      try {
        await pool.query('DELETE FROM chat_messages WHERE is_deleted = TRUE');
      } catch (err) {}

      // Initialize last_read_message_id for existing conversation members if needed
      try {
        await pool.query(`
          UPDATE chat_conversation_members m
          SET last_read_message_id = COALESCE((
            SELECT MAX(id) FROM chat_messages WHERE conversation_id = m.conversation_id AND (status = 'seen' OR sender_id = m.user_id)
          ), 0)
          WHERE m.last_read_message_id IS NULL OR m.last_read_message_id = 0;
        `);
      } catch (err) {}

      // Normalize existing Bangladesh phone numbers to 11 digits without country code
      try {
        await pool.query(`UPDATE chat_users SET phone = '0' || SUBSTRING(phone FROM 4) WHERE phone ~ '^8801[0-9]{9}$'`);
        await pool.query(`UPDATE chat_users SET phone = '0' || SUBSTRING(phone FROM 5) WHERE phone ~ '^\\+8801[0-9]{9}$'`);
      } catch (err) {}

      // Ensure at least one administrator exists if users are already registered
      try {
        const adminCheck = await pool.query('SELECT id FROM chat_users WHERE is_admin = TRUE LIMIT 1');
        if (!adminCheck.rows.length) {
          await pool.query('UPDATE chat_users SET is_admin = TRUE WHERE id = (SELECT id FROM chat_users ORDER BY id ASC LIMIT 1)');
        }
        if (ADMIN_PHONE) {
          const adminVariants = getPhoneVariants(ADMIN_PHONE);
          if (adminVariants.length) {
            const ph = adminVariants.map((_, i) => `$${i + 1}`).join(', ');
            await pool.query(`UPDATE chat_users SET is_admin = TRUE WHERE phone IN (${ph})`, adminVariants);
          }
        }
      } catch (err) {
        // chat_users table might not be initialized yet
      }

      // Reuse a database-persisted signing key by default so Coolify deployments
      // need no extra environment variable and all app replicas share sessions.
      let signingSecret = SESSION_SECRET;
      if (!signingSecret) {
        await pool.query(
          `INSERT INTO chat_app_config (key, value)
           VALUES ('session_secret', $1)
           ON CONFLICT (key) DO NOTHING`,
          [crypto.randomBytes(48).toString('base64url')]
        );
        const secretResult = await pool.query(
          "SELECT value FROM chat_app_config WHERE key = 'session_secret'"
        );
        signingSecret = secretResult.rows[0] && secretResult.rows[0].value;
      }
      sessionAuth = createSessionAuth(signingSecret);
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

function normalizePhoneForStorage(phone) {
  if (typeof phone !== 'string') return '';
  const cleaned = sanitizePhone(phone);
  if (!cleaned) return '';

  // If explicit country code other than +880 is present, keep as international
  if (cleaned.startsWith('+') && !cleaned.startsWith('+880')) {
    return cleaned;
  }

  const digits = cleaned.replace(/\D/g, '');
  if (!digits) return '';

  // Bangladesh phone number normalization (stored as 11 digits: 01XXXXXXXXX without country code)
  if (digits.startsWith('8801') && digits.length === 13) {
    return '0' + digits.slice(3); // 01712345678
  }
  if (digits.startsWith('88001') && digits.length === 14) {
    return '0' + digits.slice(4); // 01712345678
  }
  if (digits.startsWith('01') && digits.length === 11) {
    return digits; // 01712345678
  }
  if (digits.startsWith('1') && digits.length === 10 && /^[3-9]/.test(digits.slice(1))) {
    return '0' + digits; // 01712345678
  }

  return cleaned;
}

function getPhoneVariants(phone) {
  const cleaned = sanitizePhone(phone);
  if (!cleaned) return [];
  const set = new Set();
  set.add(cleaned);

  const normalized = normalizePhoneForStorage(phone);
  if (normalized) set.add(normalized);

  const digits = cleaned.replace(/\D/g, '');

  // Bangladesh phone number normalization variants:
  if (digits.startsWith('8801') && digits.length === 13) {
    const local = '0' + digits.slice(3); // 01712345678
    set.add(local);
    set.add('+' + digits);
    set.add(digits);
  } else if (digits.startsWith('88001') && digits.length === 14) {
    const local = '0' + digits.slice(4); // 01712345678
    const standard = '880' + digits.slice(4); // 8801712345678
    set.add(local);
    set.add('+' + standard);
    set.add(standard);
  } else if (digits.startsWith('01') && digits.length === 11) {
    const intl = '880' + digits.slice(1); // 8801712345678
    set.add(digits);
    set.add('+' + intl);
    set.add(intl);
  } else if (digits.startsWith('1') && digits.length === 10 && /^[3-9]/.test(digits.slice(1))) {
    const local = '0' + digits;
    const intl = '880' + digits;
    set.add(local);
    set.add('+' + intl);
    set.add(intl);
  }

  // General international +/- variations
  if (cleaned.startsWith('+')) {
    set.add(cleaned.slice(1));
  } else if (/^\d{7,16}$/.test(cleaned)) {
    set.add('+' + cleaned);
  }

  return Array.from(set);
}

function arePhonesMatching(phone1, phone2) {
  if (!phone1 || !phone2) return false;
  const v1 = new Set(getPhoneVariants(phone1));
  const v2 = getPhoneVariants(phone2);
  return v2.some((v) => v1.has(v));
}

async function findUserByPhone(phone) {
  const variants = getPhoneVariants(phone);
  if (!variants.length) return null;
  const placeholders = variants.map((_, i) => `$${i + 1}`).join(', ');
  const { rows } = await pool.query(
    `SELECT id, phone, name, avatar_color, avatar_url, is_admin, is_suspended, password_hash, password_cleared, password_reset_requested, created_at
     FROM chat_users
     WHERE phone IN (${placeholders})
     LIMIT 1`,
    variants
  );
  if (!rows.length) return null;
  const user = rows[0];
  user.id = Number(user.id);
  return user;
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

async function getUserById(id) {
  if (!id) return null;
  const { rows } = await pool.query(
    'SELECT id, phone, name, avatar_color, avatar_url, is_admin, is_suspended, password_cleared, password_reset_requested, created_at FROM chat_users WHERE id = $1',
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
  fileFilter: (req, file, cb) => {
    const orig = (file.originalname || '').toLowerCase();
    const blockedExts = ['.exe', '.bat', '.cmd', '.sh', '.vbs', '.msi', '.ps1', '.com', '.scr', '.pif'];
    const isBlocked = blockedExts.some((ext) => orig.endsWith(ext));
    if (isBlocked) {
      cb(new Error('Executable script and binary files (.exe, .bat, etc.) cannot be uploaded for security reasons.'));
    } else {
      cb(null, true);
    }
  },
});

async function persistMediaFile(file) {
  if (!file || !file.filename || !file.path) return;
  try {
    const data = await fs.promises.readFile(file.path);
    await pool.query(
      `INSERT INTO chat_media_files (filename, mime_type, data, size)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (filename) DO UPDATE SET data = $3, mime_type = $2, size = $4`,
      [file.filename, file.mimetype || 'application/octet-stream', data, file.size || data.length]
    );
  } catch (err) {
    console.error('Failed to persist media file to DB:', err);
  }
}

function isHeicFile(filename, mimetype) {
  const name = String(filename || '').toLowerCase();
  const mime = String(mimetype || '').toLowerCase();
  return (
    name.endsWith('.heic') ||
    name.endsWith('.heif') ||
    mime === 'image/heic' ||
    mime === 'image/heif'
  );
}

async function convertHeicBufferToJpeg(buffer) {
  if (!heicConvert || !buffer) return null;
  try {
    return await heicConvert({
      buffer,
      format: 'JPEG',
      quality: 0.92,
    });
  } catch (err) {
    console.error('HEIC to JPEG conversion error:', err.message);
    return null;
  }
}

async function processUploadedFile(file) {
  if (!file || !file.path) return file;
  if (isHeicFile(file.originalname, file.mimetype) || isHeicFile(file.filename, file.mimetype)) {
    try {
      const data = await fs.promises.readFile(file.path);
      const converted = await convertHeicBufferToJpeg(data);
      if (converted && converted.length) {
        const oldPath = file.path;
        const newFilename = file.filename.replace(/\.(heic|heif)$/i, '') + '.jpg';
        const newPath = path.join(UPLOADS_DIR, newFilename);

        await fs.promises.writeFile(newPath, converted);
        if (oldPath !== newPath && fs.existsSync(oldPath)) {
          await fs.promises.unlink(oldPath).catch(() => {});
        }

        file.filename = newFilename;
        file.path = newPath;
        file.mimetype = 'image/jpeg';
        file.size = converted.length;
        file.originalname = (file.originalname || 'photo').replace(/\.(heic|heif)$/i, '') + '.jpg';
      }
    } catch (err) {
      console.error('Failed to convert uploaded HEIC file to JPEG:', err);
    }
  }
  return file;
}

/* -------------------------------------------------------------------- http */

const ASSET_VERSION = String(Date.now());
const indexHtml = fs
  .readFileSync(path.join(__dirname, 'views', 'index.html'), 'utf8')
  .replaceAll('{{BASE}}', PREFIX)
  .replaceAll('{{VERSION}}', ASSET_VERSION);

function getIndexHtml() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, 'views', 'index.html'), 'utf8');
    return raw
      .replaceAll('{{BASE}}', PREFIX)
      .replaceAll('{{VERSION}}', String(Date.now()));
  } catch {
    return indexHtml;
  }
}

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

// Favicon route with explicit no-cache headers to overwrite old browser-cached favicons
app.get(['/favicon.ico', '/static/favicon.svg'], (req, res) => {
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'public', 'favicon.svg'));
});

// Serve static assets and uploaded media with dynamic PostgreSQL restore
const uploadRoutes = [
  '/static/uploads/:filename',
  ...(PREFIX ? [`${PREFIX}/static/uploads/:filename`] : []),
];

app.get(uploadRoutes, async (req, res, next) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(UPLOADS_DIR, filename);

  // If a HEIC file is requested, serve converted JPEG so web browsers never fail or show broken media
  if (isHeicFile(filename)) {
    const cachedJpgName = filename.replace(/\.(heic|heif)$/i, '') + '.jpg';
    const cachedJpgPath = path.join(UPLOADS_DIR, cachedJpgName);
    if (fs.existsSync(cachedJpgPath)) {
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=2592000');
      return res.sendFile(cachedJpgPath);
    }

    let rawData = null;
    if (fs.existsSync(filePath)) {
      try {
        rawData = await fs.promises.readFile(filePath);
      } catch (e) {}
    }
    if (!rawData) {
      try {
        const { rows } = await pool.query(
          'SELECT data FROM chat_media_files WHERE filename = $1',
          [filename]
        );
        if (rows.length && rows[0].data) {
          rawData = rows[0].data;
        }
      } catch (e) {}
    }

    if (rawData) {
      const converted = await convertHeicBufferToJpeg(rawData);
      if (converted && converted.length) {
        fs.promises.writeFile(cachedJpgPath, converted).catch(() => {});
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=2592000');
        res.setHeader('Content-Length', converted.length);
        return res.end(converted);
      }
    }
  }

  if (fs.existsSync(filePath)) {
    return next();
  }

  // Not on disk (e.g. after container redeploy) -> fetch from database
  try {
    const { rows } = await pool.query(
      'SELECT mime_type, data FROM chat_media_files WHERE filename = $1',
      [filename]
    );
    if (rows.length && rows[0].data) {
      // Re-cache to disk for fast subsequent reads
      try {
        await fs.promises.writeFile(filePath, rows[0].data);
      } catch (writeErr) {
        console.error('Failed to write media cache to disk:', writeErr);
      }
      res.setHeader('Content-Type', rows[0].mime_type || 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=2592000');
      res.setHeader('Content-Length', rows[0].data.length);
      return res.end(rows[0].data);
    }
  } catch (err) {
    console.error('Error fetching media from DB:', err);
  }

  next();
});

const staticUploadsDirs = [
  '/static/uploads',
  ...(PREFIX ? [`${PREFIX}/static/uploads`] : []),
];
app.use(staticUploadsDirs, express.static(UPLOADS_DIR, { index: false, maxAge: '30d' }));
app.use('/static', express.static(path.join(__dirname, 'public'), { index: false, maxAge: '7d' }));

const server = http.createServer(app);
server.keepAliveTimeout = 120_000;
server.headersTimeout = 121_000;
const io = new Server(server, {path: '/socket.io',
  maxHttpBufferSize: 16 * 1024 * 1024, // 16MB for live packets
  pingInterval: 25_000,
  pingTimeout: 20_000,
  connectTimeout: 15_000,});
const onlineUsers = new Set(); // Set of userIds currently online

// In-memory active calls and user-to-call mappings for WebRTC signaling
const activeCalls = new Map(); // callId -> callRecord
const userActiveCalls = new Map(); // userId -> callId

function formatCallDuration(durationSec) {
  const s = Math.max(1, Math.round(durationSec));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}:${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

async function recordCallMessage(call, reason) {
  try {
    if (!call || !call.conversationId || !call.callerId) return;

    const isAnswered = call.status === 'active' && call.acceptedAt;
    let duration = 0;
    let durationFormatted = '00:00';
    let callStatus = 'missed';

    if (isAnswered) {
      callStatus = 'ended';
      duration = Math.max(1, Math.round((Date.now() - call.acceptedAt) / 1000));
      durationFormatted = formatCallDuration(duration);
    } else if (reason === 'declined') {
      callStatus = 'declined';
    } else {
      callStatus = 'missed';
    }

    const isVideo = call.callType === 'video';
    let body = '';
    if (callStatus === 'ended') {
      body = `${isVideo ? 'Video call' : 'Voice call'} • ${durationFormatted}`;
    } else if (callStatus === 'declined') {
      body = isVideo ? 'Declined video call' : 'Declined voice call';
    } else {
      body = isVideo ? 'Missed video call' : 'Missed voice call';
    }

    const mediaList = [
      {
        callId: call.id,
        callType: call.callType || 'audio',
        status: callStatus,
        duration,
        durationFormatted,
        callerId: call.callerId,
        calleeId: call.calleeId,
        reason,
      },
    ];

    const convId = call.conversationId;
    const caller = await getUserById(call.callerId);
    const callerName = (caller && caller.name) || 'User';

    // Fetch conversation members
    const members = await pool.query(
      'SELECT user_id FROM chat_conversation_members WHERE conversation_id = $1',
      [convId]
    );

    const anyOtherOnline = members.rows.some(
      (m) => Number(m.user_id) !== call.callerId && onlineUsers.has(Number(m.user_id))
    );
    const initialStatus = anyOtherOnline ? 'delivered' : 'sent';

    const mediaListJson = JSON.stringify(mediaList);
    const msgRes = await pool.query(
      `INSERT INTO chat_messages (conversation_id, sender_id, sender_name, body, media_type, media_list, status)
       VALUES ($1, $2, $3, $4, 'call', $5, $6)
       RETURNING id, created_at`,
      [convId, call.callerId, callerName, body, mediaListJson, initialStatus]
    );

    await pool.query('UPDATE chat_conversation_members SET is_hidden = FALSE WHERE conversation_id = $1', [convId]);
    await pool.query('UPDATE chat_conversations SET updated_at = now() WHERE id = $1', [convId]);

    const msg = {
      id: Number(msgRes.rows[0].id),
      conversationId: convId,
      senderId: call.callerId,
      senderName: callerName,
      senderAvatarUrl: caller ? caller.avatar_url : null,
      senderAvatarColor: caller ? caller.avatar_color : 0,
      text: body,
      mediaType: 'call',
      mediaList,
      status: initialStatus,
      reactions: [],
      ts: new Date(msgRes.rows[0].created_at).getTime(),
    };

    const targetRooms = [`c:${convId}`];
    for (const m of members.rows) {
      targetRooms.push(`u:${m.user_id}`);
    }
    io.to(targetRooms).emit('message', msg);

    const icon = isVideo ? '📹' : '📞';
    const snippetText = `${icon} ${body}`;
    for (const m of members.rows) {
      io.to(`u:${m.user_id}`).emit('conversation_updated', {
        conversationId: convId,
        lastMessage: {
          text: snippetText,
          senderName: callerName,
          ts: msg.ts,
        },
      });
    }
  } catch (err) {
    console.error('Failed to record call message:', err);
  }
}

function cleanupCall(callId, reason = 'ended') {
  const call = activeCalls.get(callId);
  if (!call) return null;
  if (call.timeoutTimer) {
    clearTimeout(call.timeoutTimer);
  }
  activeCalls.delete(callId);
  userActiveCalls.delete(call.callerId);
  userActiveCalls.delete(call.calleeId);

  // Record call completion or missed call in chat
  recordCallMessage(call, reason).catch((err) => {
    console.error('recordCallMessage failed:', err);
  });

  return call;
}

const routeContext = {
  app, pool, fs, path, UPLOADS_DIR, PREFIX, ADMIN_PHONE, io, onlineUsers,
  authMiddleware, adminMiddleware, sanitizePhone, normalizePhoneForStorage,
  getPhoneVariants, arePhonesMatching, findUserByPhone, hashPassword, verifyPassword,
  generateToken, getUserById, areFriends, getMessagesReactions, upload,
  persistMediaFile, processUploadedFile,
};
/* --------------------------------------------------------------- API routes */

// Healthcheck with media diagnosis
app.get(['/healthz', ...(PREFIX ? [`${PREFIX}/healthz`] : [])], async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    await pool.query('SELECT 1');
    const filesCount = await pool.query('SELECT count(*) FROM chat_media_files');
    const recentMedia = await pool.query(
      `SELECT id, sender_name, media_url, media_type, created_at
       FROM chat_messages
       WHERE media_url IS NOT NULL OR media_list IS NOT NULL
       ORDER BY id DESC LIMIT 5`
    );
    const mediaFiles = await pool.query(
      'SELECT filename, mime_type, size, created_at FROM chat_media_files ORDER BY created_at DESC LIMIT 5'
    );
    res.json({
      ok: true,
      db: true,
      uptime: Math.round(process.uptime()),
      chatMediaFilesCount: Number(filesCount.rows[0].count),
      recentMediaMessages: recentMedia.rows,
      mediaFilesSample: mediaFiles.rows,
    });
  } catch (err) {
    res.status(503).json({ ok: false, db: false, error: err.message });
  }
});

  registerAuthRoutes(routeContext);

// Check friendship helper
async function areFriends(userId1, userId2) {
  if (!userId1 || !userId2) return false;
  const { rows } = await pool.query(
    'SELECT 1 FROM chat_friends WHERE user_id = $1 AND friend_id = $2',
    [userId1, userId2]
  );
  return rows.length > 0;
}

  registerContactRoutes(routeContext);

  registerConversationRoutes(routeContext);

async function getMessagesReactions(messageIds) {
  if (!messageIds || !messageIds.length) return {};
  const ph = messageIds.map((_, i) => `$${i + 1}`).join(', ');
  const { rows } = await pool.query(
    `SELECT r.message_id, r.user_id, r.emoji, u.name as user_name
     FROM chat_message_reactions r
     JOIN chat_users u ON r.user_id = u.id
     WHERE r.message_id IN (${ph})
     ORDER BY r.id ASC`,
    messageIds
  );
  const map = {};
  for (const mid of messageIds) {
    map[mid] = [];
  }
  const byMsgAndEmoji = {};
  for (const r of rows) {
    const mid = Number(r.message_id);
    if (!byMsgAndEmoji[mid]) byMsgAndEmoji[mid] = {};
    if (!byMsgAndEmoji[mid][r.emoji]) {
      byMsgAndEmoji[mid][r.emoji] = {
        emoji: r.emoji,
        count: 0,
        users: [],
      };
    }
    byMsgAndEmoji[mid][r.emoji].count++;
    byMsgAndEmoji[mid][r.emoji].users.push({
      id: Number(r.user_id),
      name: r.user_name,
    });
  }
  for (const mid of Object.keys(byMsgAndEmoji)) {
    map[mid] = Object.values(byMsgAndEmoji[mid]);
  }
  return map;
}

  registerMessageRoutes(routeContext);

  registerAdminRoutes(routeContext);

// Page HTML
app.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.type('html').send(getIndexHtml());
});

app.use((req, res) => res.status(404).type('text').send('Not found'));



/* ---------------------------------------------------------------- realtime */



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
    const tempId = payload && payload.tempId ? String(payload.tempId) : null;
    const convId = Number(payload && payload.conversationId);
    const text = String((payload && payload.text) || '').trim();
    const mediaList = (payload && Array.isArray(payload.mediaList) && payload.mediaList.length > 0) ? payload.mediaList : null;
    let mediaUrl = payload && payload.mediaUrl ? String(payload.mediaUrl) : null;
    let mediaType = payload && payload.mediaType ? String(payload.mediaType) : null;
    let mediaName = payload && payload.mediaName ? String(payload.mediaName) : null;
    const replyToId = payload && payload.replyToId ? Number(payload.replyToId) : null;
    const replyToSender = payload && payload.replyToSender ? String(payload.replyToSender).slice(0, 100) : null;
    const replyToText = payload && payload.replyToText ? String(payload.replyToText).slice(0, 300) : null;

    if (mediaList && mediaList.length > 0) {
      if (!mediaUrl) mediaUrl = mediaList[0].url;
      if (!mediaType) mediaType = mediaList[0].mediaType;
      if (!mediaName) mediaName = mediaList[0].mediaName;
    }

    if (!convId) return reply({ ok: false, error: 'Invalid conversation.' });
    if (!text && !mediaUrl && (!mediaList || !mediaList.length)) return reply({ ok: false, error: 'Message cannot be empty.' });

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

      // Fetch conversation members
      const members = await pool.query(
        'SELECT user_id FROM chat_conversation_members WHERE conversation_id = $1',
        [convId]
      );

      // Check if any other member is currently connected
      const anyOtherOnline = members.rows.some(
        (m) => Number(m.user_id) !== user.id && onlineUsers.has(Number(m.user_id))
      );
      const initialStatus = anyOtherOnline ? 'delivered' : 'sent';

      // Save message
      const mediaListJson = mediaList ? JSON.stringify(mediaList) : null;
      const msgRes = await pool.query(
        `INSERT INTO chat_messages (conversation_id, sender_id, sender_name, body, media_url, media_type, media_name, media_list, reply_to_id, reply_to_sender, reply_to_text, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id, created_at`,
        [convId, user.id, user.name, text, mediaUrl, mediaType, mediaName, mediaListJson, replyToId, replyToSender, replyToText, initialStatus]
      );

      // Unhide conversation for all members when new message arrives
      await pool.query('UPDATE chat_conversation_members SET is_hidden = FALSE WHERE conversation_id = $1', [convId]);

      const latestUser = await getUserById(user.id);
      const msg = {
        id: Number(msgRes.rows[0].id),
        tempId,
        conversationId: convId,
        senderId: user.id,
        senderName: (latestUser && latestUser.name) || user.name,
        senderAvatarUrl: latestUser ? latestUser.avatar_url : null,
        senderAvatarColor: latestUser ? latestUser.avatar_color : 0,
        text,
        mediaUrl,
        mediaType,
        mediaName,
        mediaList: mediaList || (mediaUrl ? [{ url: mediaUrl, mediaType, mediaName }] : null),
        replyToId,
        replyToSender,
        replyToText,
        status: initialStatus,
        reactions: [],
        ts: new Date(msgRes.rows[0].created_at).getTime(),
      };

      // Update conversation updated_at
      await pool.query('UPDATE chat_conversations SET updated_at = now() WHERE id = $1', [convId]);

      // Broadcast to active conversation room AND each member's personal user room
      const targetRooms = [`c:${convId}`];
      for (const m of members.rows) {
        targetRooms.push(`u:${m.user_id}`);
      }
      io.to(targetRooms).emit('message', msg);

      let snippetText = text;
      if (!snippetText) {
        if (mediaList && mediaList.length > 1) {
          snippetText = `📎 ${mediaList.length} files`;
        } else if (mediaType === 'audio') {
          snippetText = '🎤 Voice note';
        } else if (mediaType === 'image') {
          snippetText = '📷 Photo';
        } else if (mediaType === 'video') {
          snippetText = '🎥 Video';
        } else if (mediaType === 'file') {
          snippetText = `📎 ${mediaName || 'Document'}`;
        }
      }

      for (const m of members.rows) {
        io.to(`u:${m.user_id}`).emit('conversation_updated', {
          conversationId: convId,
          lastMessage: {
            text: snippetText,
            senderName: user.name,
            ts: msg.ts,
          },
        });
      }

      reply({ ok: true, id: msg.id, tempId });
    } catch (err) {
      console.error('Socket message failed:', err);
      reply({ ok: false, error: 'Failed to send message.' });
    }
  });

  // Edit message
  socket.on('edit_message', async (payload, ack) => {
    const reply = typeof ack === 'function' ? ack : () => {};
    const msgId = Number(payload && payload.id);
    const newText = String((payload && payload.text) || '').trim();

    if (!msgId || !newText) {
      return reply({ ok: false, error: 'Invalid message or empty text.' });
    }

    try {
      const { rows } = await pool.query(
        'SELECT id, conversation_id, sender_id, is_deleted FROM chat_messages WHERE id = $1',
        [msgId]
      );
      if (!rows.length || rows[0].is_deleted) {
        return reply({ ok: false, error: 'Message not found.' });
      }

      const msg = rows[0];
      const memberCheck = await pool.query(
        'SELECT 1 FROM chat_conversation_members WHERE conversation_id = $1 AND user_id = $2',
        [msg.conversation_id, user.id]
      );
      if (!memberCheck.rows.length) {
        return reply({ ok: false, error: 'You are not a member of this conversation.' });
      }
      if (Number(msg.sender_id) !== user.id && !user.is_admin) {
        return reply({ ok: false, error: 'You can only edit your own messages.' });
      }

      await pool.query(
        'UPDATE chat_messages SET body = $1, is_edited = TRUE, edited_at = now() WHERE id = $2',
        [newText, msgId]
      );

      const editedAt = Date.now();
      io.to(`c:${msg.conversation_id}`).emit('message_edited', {
        id: msgId,
        conversationId: Number(msg.conversation_id),
        text: newText,
        isEdited: true,
        editedAt,
      });

      reply({ ok: true, id: msgId, text: newText, isEdited: true, editedAt });
    } catch (err) {
      console.error('Socket edit_message error:', err);
      reply({ ok: false, error: 'Failed to edit message.' });
    }
  });

  // React to message (Toggle or set reaction)
  socket.on('react_message', async (payload, ack) => {
    const reply = typeof ack === 'function' ? ack : () => {};
    const msgId = Number(payload && payload.messageId);
    const emoji = String((payload && payload.emoji) || '').trim();

    if (!msgId || !emoji) {
      return reply({ ok: false, error: 'Invalid message or emoji.' });
    }

    try {
      const { rows } = await pool.query(
        'SELECT id, conversation_id, is_deleted FROM chat_messages WHERE id = $1',
        [msgId]
      );
      if (!rows.length || rows[0].is_deleted) {
        return reply({ ok: false, error: 'Message not found.' });
      }

      const convId = Number(rows[0].conversation_id);
      const memberCheck = await pool.query(
        'SELECT 1 FROM chat_conversation_members WHERE conversation_id = $1 AND user_id = $2',
        [convId, user.id]
      );
      if (!memberCheck.rows.length) {
        return reply({ ok: false, error: 'You are not a member of this conversation.' });
      }

      const existing = await pool.query(
        'SELECT id, emoji FROM chat_message_reactions WHERE message_id = $1 AND user_id = $2',
        [msgId, user.id]
      );

      if (existing.rows.length) {
        if (existing.rows[0].emoji === emoji) {
          // Toggle off
          await pool.query(
            'DELETE FROM chat_message_reactions WHERE message_id = $1 AND user_id = $2',
            [msgId, user.id]
          );
        } else {
          // Switch emoji
          await pool.query(
            'UPDATE chat_message_reactions SET emoji = $1, created_at = now() WHERE message_id = $2 AND user_id = $3',
            [emoji, msgId, user.id]
          );
        }
      } else {
        await pool.query(
          'INSERT INTO chat_message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)',
          [msgId, user.id, emoji]
        );
      }

      const reactionsMap = await getMessagesReactions([msgId]);
      const updatedReactions = reactionsMap[msgId] || [];

      io.to(`c:${convId}`).emit('message_reaction_updated', {
        messageId: msgId,
        conversationId: convId,
        userId: user.id,
        reactions: updatedReactions,
      });

      reply({ ok: true, messageId: msgId, reactions: updatedReactions });
    } catch (err) {
      console.error('Socket react_message error:', err);
      reply({ ok: false, error: 'Failed to update reaction.' });
    }
  });

  // Typing
  socket.on('typing', async (payload) => {
    const convId = Number(payload && payload.conversationId);
    if (!convId) return;
    try {
      const memberCheck = await pool.query(
        'SELECT 1 FROM chat_conversation_members WHERE conversation_id = $1 AND user_id = $2',
        [convId, user.id]
      );
      if (!memberCheck.rows.length) return;
      socket.to(`c:${convId}`).emit('typing', {
        conversationId: convId,
        userId: user.id,
        userName: user.name,
        typing: Boolean(payload.typing),
      });
    } catch (err) {
      console.error('Socket typing error:', err);
    }
  });

  // Message delivered acknowledgment
  socket.on('message_delivered', async (payload) => {
    const msgId = Number(payload && payload.messageId);
    if (!msgId) return;
    try {
      const res = await pool.query(
        `UPDATE chat_messages
         SET status = 'delivered'
         WHERE id = $1 AND status = 'sent' AND sender_id != $2
           AND EXISTS (
             SELECT 1 FROM chat_conversation_members
             WHERE conversation_id = chat_messages.conversation_id AND user_id = $2
           )
         RETURNING sender_id, conversation_id`,
        [msgId, user.id]
      );
      if (res.rows.length) {
        const senderId = Number(res.rows[0].sender_id);
        const cId = Number(res.rows[0].conversation_id);
        io.to(`u:${senderId}`).emit('message_status_update', { messageId: msgId, status: 'delivered', conversationId: cId });
      }
    } catch (e) {}
  });

  // Conversation seen acknowledgment
  socket.on('conversation_seen', async (payload) => {
    const convId = Number(payload && payload.conversationId);
    if (!convId) return;
    try {
      const memberCheck = await pool.query(
        'SELECT 1 FROM chat_conversation_members WHERE conversation_id = $1 AND user_id = $2',
        [convId, user.id]
      );
      if (!memberCheck.rows.length) return;

      const maxMsg = await pool.query(
        'SELECT COALESCE(MAX(id), 0) as max_id FROM chat_messages WHERE conversation_id = $1',
        [convId]
      );
      const maxId = Number(maxMsg.rows[0].max_id);
      if (maxId > 0) {
        await pool.query(
          'UPDATE chat_conversation_members SET last_read_message_id = GREATEST(COALESCE(last_read_message_id, 0), $1) WHERE conversation_id = $2 AND user_id = $3',
          [maxId, convId, user.id]
        );
      }

      const res = await pool.query(
        "UPDATE chat_messages SET status = 'seen' WHERE conversation_id = $1 AND sender_id != $2 AND status != 'seen'",
        [convId, user.id]
      );
      if (res.rowCount > 0) {
        io.to(`c:${convId}`).emit('conversation_seen', { conversationId: convId, seenBy: user.id });
      }
      io.to(`u:${user.id}`).emit('unread_count_updated', { conversationId: convId, unreadCount: 0 });
    } catch (e) {}
  });

  /* ---------------------- WebRTC Calling Signaling ---------------------- */

  // Initiate call
  socket.on('call_initiate', async (payload, ack) => {
    const reply = typeof ack === 'function' ? ack : () => {};
    const targetUserId = Number(payload && payload.targetUserId);
    const convId = Number(payload && payload.conversationId);
    const callType = (payload && payload.callType) === 'video' ? 'video' : 'audio';

    if (!targetUserId || !convId) {
      return reply({ ok: false, error: 'Invalid call target' });
    }
    if (targetUserId === user.id) {
      return reply({ ok: false, error: 'Cannot call yourself' });
    }

    if (userActiveCalls.has(user.id)) {
      return reply({ ok: false, error: 'You are already in a call' });
    }

    if (!onlineUsers.has(targetUserId)) {
      return reply({ ok: false, error: 'User is currently offline' });
    }

    if (userActiveCalls.has(targetUserId)) {
      return reply({ ok: false, error: 'User is busy on another call', isBusy: true });
    }

    try {
      const { rows } = await pool.query(
        `SELECT user_id FROM chat_conversation_members
         WHERE conversation_id = $1 AND user_id IN ($2, $3)`,
        [convId, user.id, targetUserId]
      );
      if (rows.length < 2) {
        return reply({ ok: false, error: 'Both users must be members of the conversation' });
      }
    } catch (err) {
      console.error('Call initiate error:', err);
      return reply({ ok: false, error: 'Could not initiate call' });
    }

    const callId = `call_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const callRecord = {
      id: callId,
      callerId: user.id,
      calleeId: targetUserId,
      conversationId: convId,
      callType,
      status: 'ringing',
      createdAt: Date.now(),
      timeoutTimer: null,
    };

    // Auto-timeout after 45 seconds if unanswered
    callRecord.timeoutTimer = setTimeout(() => {
      const active = activeCalls.get(callId);
      if (active && active.status === 'ringing') {
        cleanupCall(callId, 'timeout');
        io.to(`u:${user.id}`).emit('call_rejected', { callId, reason: 'no-answer' });
        io.to(`u:${targetUserId}`).emit('call_ended', { callId, reason: 'missed' });
      }
    }, 45000);

    activeCalls.set(callId, callRecord);
    userActiveCalls.set(user.id, callId);
    userActiveCalls.set(targetUserId, callId);

    // Notify callee
    io.to(`u:${targetUserId}`).emit('call_incoming', {
      callId,
      caller: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        avatarColor: user.avatar_color,
      },
      conversationId: convId,
      callType,
    });

    reply({ ok: true, callId });
  });

  // Accept call
  socket.on('call_accept', (payload, ack) => {
    const reply = typeof ack === 'function' ? ack : () => {};
    const callId = payload && payload.callId;
    const call = activeCalls.get(callId);

    if (!call || call.calleeId !== user.id) {
      return reply({ ok: false, error: 'Call no longer active' });
    }

    if (call.timeoutTimer) {
      clearTimeout(call.timeoutTimer);
      call.timeoutTimer = null;
    }

    call.status = 'active';
    call.acceptedAt = Date.now();

    io.to(`u:${call.callerId}`).emit('call_accepted', {
      callId,
      callee: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        avatarUrl: user.avatar_url,
        avatarColor: user.avatar_color,
      },
    });

    reply({ ok: true });
  });

  // Reject / Decline call
  socket.on('call_reject', (payload, ack) => {
    const reply = typeof ack === 'function' ? ack : () => {};
    const callId = payload && payload.callId;
    const reason = (payload && payload.reason) || 'declined';
    const call = activeCalls.get(callId);

    if (!call) return reply({ ok: false, error: 'Call not found' });

    cleanupCall(callId, reason);

    const targetId = (call.callerId === user.id) ? call.calleeId : call.callerId;
    io.to(`u:${targetId}`).emit('call_rejected', { callId, reason });

    reply({ ok: true });
  });

  // WebRTC Signaling Relay (SDP offer/answer, ICE candidates)
  socket.on('call_signal', (payload) => {
    const callId = payload && payload.callId;
    const signal = payload && payload.signal;
    if (!callId || !signal) return;

    const call = activeCalls.get(callId);
    if (!call) return;

    const targetUserId = (call.callerId === user.id) ? call.calleeId : call.callerId;
    io.to(`u:${targetUserId}`).emit('call_signal', {
      callId,
      senderId: user.id,
      signal,
    });
  });

  // End active call
  socket.on('call_end', (payload, ack) => {
    const reply = typeof ack === 'function' ? ack : () => {};
    const callId = payload && payload.callId;
    const reason = (payload && payload.reason) || 'hangup';
    const call = activeCalls.get(callId);

    if (call) {
      cleanupCall(callId, reason);
      const peerId = (call.callerId === user.id) ? call.calleeId : call.callerId;
      io.to(`u:${peerId}`).emit('call_ended', { callId, reason });
    }

    reply({ ok: true });
  });

  // Disconnect
  socket.on('disconnect', () => {
    onlineUsers.delete(user.id);
    io.emit('user_status', { userId: user.id, isOnline: false });

    // Clean up call if disconnecting while active/ringing
    if (userActiveCalls.has(user.id)) {
      const callId = userActiveCalls.get(user.id);
      const call = cleanupCall(callId, 'disconnected');
      if (call) {
        const peerId = (call.callerId === user.id) ? call.calleeId : call.callerId;
        io.to(`u:${peerId}`).emit('call_ended', { callId, reason: 'disconnected' });
      }
    }
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
