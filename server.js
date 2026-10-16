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

        -- Migrations for profile pic, conversation clear, and friend requests
        ALTER TABLE chat_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
        ALTER TABLE chat_conversation_members ADD COLUMN IF NOT EXISTS cleared_at TIMESTAMPTZ;
        ALTER TABLE chat_conversation_members ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;
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

      // Permanently clear all accumulated ("jomanu") deleted messages
      try {
        await pool.query('DELETE FROM chat_messages WHERE is_deleted = TRUE');
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
    `SELECT id, phone, name, avatar_color, avatar_url, is_admin, is_suspended, password_hash, created_at
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
  fileFilter: (req, file, cb) => {
    const mime = (file.mimetype || '').toLowerCase();
    const orig = (file.originalname || '').toLowerCase();
    const isImage = mime.startsWith('image/');
    const isAudio =
      orig.startsWith('voice-') ||
      mime.startsWith('audio/') ||
      orig.endsWith('.webm') ||
      orig.endsWith('.ogg') ||
      orig.endsWith('.wav') ||
      orig.endsWith('.mp3') ||
      orig.endsWith('.m4a') ||
      orig.endsWith('.aac') ||
      orig.endsWith('.opus') ||
      mime.includes('webm') ||
      mime.includes('ogg') ||
      mime.includes('wav');
    const isVideo = !isAudio && (mime.startsWith('video/') || orig.endsWith('.mp4') || orig.endsWith('.mov'));
    if (isImage || isVideo || isAudio) {
      cb(null, true);
    } else {
      cb(new Error('Only photo, video, and audio files are supported.'));
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

// Auth: Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const phone = sanitizePhone(req.body.phone);
    const phoneToStore = normalizePhoneForStorage(phone);
    const password = String(req.body.password || '');

    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({ ok: false, error: 'Name must be between 2 and 50 characters.' });
    }
    if (phoneToStore.startsWith('01')) {
      if (phoneToStore.length !== 11) {
        return res.status(400).json({ ok: false, error: 'Bangladesh mobile number must be 11 digits (e.g. 01712345678).' });
      }
    } else if (phone.length < 7 || phone.length > 16) {
      return res.status(400).json({ ok: false, error: 'Please enter a valid phone number (7-16 digits).' });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 6 characters.' });
    }

    const existing = await findUserByPhone(phone);
    if (existing) {
      return res.status(400).json({ ok: false, error: 'An account with this phone number already exists.' });
    }

    // Determine admin status: first user or matches ADMIN_PHONE
    const userCountRes = await pool.query('SELECT count(*)::int as count FROM chat_users');
    const isFirstUser = userCountRes.rows[0].count === 0;
    const matchesAdminPhone = ADMIN_PHONE && arePhonesMatching(phone, ADMIN_PHONE);
    const isAdmin = Boolean(isFirstUser || matchesAdminPhone);

    const hash = hashPassword(password);
    const avatarColor = Math.floor(Math.random() * 10);

    const insertRes = await pool.query(
      `INSERT INTO chat_users (phone, name, password_hash, avatar_color, is_admin)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, phone, name, avatar_color, is_admin, created_at`,
      [phoneToStore, name, hash, avatarColor, isAdmin]
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

    const user = await findUserByPhone(phone);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ ok: false, error: 'Incorrect phone number or password.' });
    }

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

    const friend = await findUserByPhone(phone);
    if (!friend) {
      return res.status(404).json({ ok: false, error: 'No user registered with this phone number.' });
    }

    if (friend.id === req.user.id) {
      return res.status(400).json({ ok: false, error: 'You cannot add yourself as a friend.' });
    }

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

// Friends: Unfriend / Remove Friend
app.delete(['/api/friends/:id', '/api/friends/:id/unfriend'], authMiddleware, async (req, res) => {
  try {
    const friendId = Number(req.params.id);
    if (!friendId) {
      return res.status(400).json({ ok: false, error: 'Valid friend ID required.' });
    }

    if (friendId === req.user.id) {
      return res.status(400).json({ ok: false, error: 'Cannot unfriend yourself.' });
    }

    // Delete mutual friendship
    await pool.query(
      'DELETE FROM chat_friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
      [req.user.id, friendId]
    );

    // Delete existing friend requests between them so clean slate
    await pool.query(
      'DELETE FROM chat_friend_requests WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)',
      [req.user.id, friendId]
    );

    // Broadcast friend removal in real-time to both users
    io.to(`u:${req.user.id}`).to(`u:${friendId}`).emit('friend_removed', {
      userId: req.user.id,
      friendId,
    });

    res.json({ ok: true, friendId, message: 'Unfriended successfully.' });
  } catch (err) {
    console.error('Unfriend failed:', err);
    res.status(500).json({ ok: false, error: 'Could not remove friend.' });
  }
});

// Friend Requests: Send request
app.post('/api/friends/request', authMiddleware, async (req, res) => {
  try {
    const phone = sanitizePhone(req.body.phone);
    if (!phone) return res.status(400).json({ ok: false, error: 'Please enter a valid phone number.' });

    const targetUser = await findUserByPhone(phone);
    if (!targetUser) return res.status(404).json({ ok: false, error: 'No user registered with this phone number.' });

    if (targetUser.id === req.user.id) return res.status(400).json({ ok: false, error: 'You cannot send a friend request to yourself.' });

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
    io.to(`u:${req.user.id}`).emit('friend_request_accepted', {
      friend: { id: senderId, name: sender ? sender.name : 'Friend', phone: sender ? sender.phone : '', avatarColor: sender ? sender.avatar_color : 0, avatarUrl: sender ? sender.avatar_url : null }
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
      `SELECT c.id, c.type, c.name, c.avatar_url, c.created_at, c.updated_at, m.cleared_at, m.is_hidden
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
      let avatarUrl = conv.avatar_url || null;
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

    const otherUser = await findUserByPhone(phone);
    if (!otherUser) {
      return res.status(404).json({ ok: false, error: 'No user registered with this phone number.' });
    }

    if (otherUser.id === req.user.id) {
      return res.status(400).json({ ok: false, error: 'Cannot start a direct chat with yourself.' });
    }

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

    // Real-time broadcast to both users so neither has to refresh
    io.to(`u:${req.user.id}`).to(`u:${otherId}`).emit('conversation_created', {
      conversationId: convId,
    });

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
      if (!clean) continue;
      const u = await findUserByPhone(clean);
      if (u && u.id !== req.user.id) {
        await pool.query(
          "INSERT INTO chat_conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING",
          [convId, u.id]
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

    const newUser = await findUserByPhone(phone);
    if (!newUser) {
      return res.status(404).json({ ok: false, error: 'No user registered with this phone number.' });
    }

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

// Conversations: Update group profile photo
app.post('/api/conversations/:id/avatar', authMiddleware, async (req, res) => {
  try {
    const convId = Number(req.params.id);
    if (!convId) return res.status(400).json({ ok: false, error: 'Invalid conversation.' });

    // Verify user is a member of this conversation
    const memberCheck = await pool.query(
      'SELECT role FROM chat_conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [convId, req.user.id]
    );
    if (!memberCheck.rows.length) {
      return res.status(403).json({ ok: false, error: 'You are not a member of this group.' });
    }

    const convRes = await pool.query('SELECT type, name FROM chat_conversations WHERE id = $1', [convId]);
    if (!convRes.rows.length || convRes.rows[0].type !== 'group') {
      return res.status(400).json({ ok: false, error: 'Only group conversations have a group photo.' });
    }

    const avatarUrl = typeof req.body.avatarUrl === 'string' ? req.body.avatarUrl.trim() : (req.body.avatarUrl === null ? null : undefined);

    if (avatarUrl !== undefined) {
      await pool.query('UPDATE chat_conversations SET avatar_url = $1, updated_at = now() WHERE id = $2', [avatarUrl, convId]);
    }

    // Broadcast update to all group members
    const members = await pool.query('SELECT user_id FROM chat_conversation_members WHERE conversation_id = $1', [convId]);
    const targetRooms = [`c:${convId}`];
    for (const m of members.rows) {
      targetRooms.push(`u:${m.user_id}`);
    }

    io.to(targetRooms).emit('group_avatar_updated', {
      conversationId: convId,
      avatarUrl: avatarUrl || null,
    });

    res.json({ ok: true, avatarUrl: avatarUrl || null });
  } catch (err) {
    console.error('Update group avatar failed:', err);
    res.status(500).json({ ok: false, error: 'Could not update group photo.' });
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
        `SELECT id, conversation_id, sender_id, sender_name, body, media_url, media_type, media_name, media_list,
                reply_to_id, reply_to_sender, reply_to_text, status, is_edited, edited_at, created_at
         FROM chat_messages
         WHERE conversation_id = $1 AND is_deleted = FALSE AND created_at > $2
         ORDER BY id DESC LIMIT 100`,
        [convId, clearedAt]
      );
      rows = q.rows;
    } else {
      const q = await pool.query(
        `SELECT id, conversation_id, sender_id, sender_name, body, media_url, media_type, media_name, media_list,
                reply_to_id, reply_to_sender, reply_to_text, status, is_edited, edited_at, created_at
         FROM chat_messages
         WHERE conversation_id = $1 AND is_deleted = FALSE
         ORDER BY id DESC LIMIT 100`,
        [convId]
      );
      rows = q.rows;
    }

    // Automatically mark messages from others in this conversation as seen
    try {
      const seenRes = await pool.query(
        "UPDATE chat_messages SET status = 'seen' WHERE conversation_id = $1 AND sender_id != $2 AND status != 'seen'",
        [convId, req.user.id]
      );
      if (seenRes.rowCount > 0 && typeof io !== 'undefined') {
        io.to(`c:${convId}`).emit('conversation_seen', { conversationId: convId, seenBy: req.user.id });
      }
    } catch (e) {}

    const messages = rows
      .map((r) => {
        let mediaList = null;
        if (r.media_list) {
          try {
            mediaList = typeof r.media_list === 'string' ? JSON.parse(r.media_list) : r.media_list;
          } catch {}
        }
        if (!mediaList && r.media_url) {
          mediaList = [{ url: r.media_url, mediaType: r.media_type, mediaName: r.media_name }];
        }

        return {
          id: Number(r.id),
          conversationId: Number(r.conversation_id),
          senderId: Number(r.sender_id),
          senderName: r.sender_name,
          text: r.body,
          mediaUrl: r.media_url,
          mediaType: r.media_type,
          mediaName: r.media_name,
          mediaList,
          replyToId: r.reply_to_id ? Number(r.reply_to_id) : null,
          replyToSender: r.reply_to_sender || null,
          replyToText: r.reply_to_text || null,
          status: r.status || 'sent',
          isEdited: !!r.is_edited,
          editedAt: r.edited_at ? new Date(r.edited_at).getTime() : null,
          ts: new Date(r.created_at).getTime(),
        };
      })
      .reverse();

    res.json({ ok: true, messages });
  } catch (err) {
    console.error('Load messages failed:', err);
    res.status(500).json({ ok: false, error: 'Could not load messages.' });
  }
});

// Media: Load all shared media for a conversation (Photos, Videos, Files, Voice notes)
app.get('/api/conversations/:id/media', authMiddleware, async (req, res) => {
  try {
    const convId = Number(req.params.id);
    const memberCheck = await pool.query(
      'SELECT cleared_at FROM chat_conversation_members WHERE conversation_id = $1 AND user_id = $2',
      [convId, req.user.id]
    );
    if (!memberCheck.rows.length) {
      return res.status(403).json({ ok: false, error: 'You are not a member of this conversation.' });
    }

    const clearedAt = memberCheck.rows[0].cleared_at ? new Date(memberCheck.rows[0].cleared_at) : null;
    let query = `
      SELECT id, sender_name, sender_id, media_url, media_type, media_name, media_list, created_at
      FROM chat_messages
      WHERE conversation_id = $1 AND is_deleted = FALSE AND (media_url IS NOT NULL OR media_list IS NOT NULL)
    `;
    const params = [convId];
    if (clearedAt) {
      query += ` AND created_at > $2`;
      params.push(clearedAt);
    }
    query += ` ORDER BY id DESC`;

    const { rows } = await pool.query(query, params);

    const photos = [];
    const videos = [];
    const files = [];
    const audio = [];

    for (const r of rows) {
      const ts = new Date(r.created_at).getTime();
      let list = null;
      if (r.media_list) {
        try {
          list = typeof r.media_list === 'string' ? JSON.parse(r.media_list) : r.media_list;
        } catch {}
      }
      if (!list || !list.length) {
        if (r.media_url) {
          list = [{ url: r.media_url, mediaType: r.media_type, mediaName: r.media_name }];
        }
      }

      if (Array.isArray(list)) {
        for (const item of list) {
          if (!item || !item.url) continue;
          const rawType = (item.mediaType || '').toLowerCase();
          const rawName = (item.mediaName || '').toLowerCase();
          const url = item.url;
          const isAudio =
            rawType === 'audio' ||
            rawType.startsWith('audio/') ||
            rawName.includes('voice note') ||
            /\.(webm|ogg|wav|mp3|m4a|aac|opus)(\?|$)/i.test(url);
          const isVideo =
            !isAudio &&
            (rawType === 'video' ||
             rawType.startsWith('video/') ||
             /\.(mp4|mov|mkv)(\?|$)/i.test(url));
          const isImage =
            !isAudio && !isVideo &&
            (rawType === 'image' ||
             rawType.startsWith('image/') ||
             /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url));

          const entry = {
            msgId: Number(r.id),
            url,
            mediaType: isAudio ? 'audio' : (isVideo ? 'video' : (isImage ? 'image' : 'file')),
            mediaName: item.mediaName || (isAudio ? 'Voice Note' : (isVideo ? 'Video' : 'Photo')),
            senderName: r.sender_name,
            ts,
          };

          if (isImage) {
            photos.push(entry);
          } else if (isVideo) {
            videos.push(entry);
          } else if (isAudio) {
            audio.push(entry);
          } else {
            files.push(entry);
          }
        }
      }
    }

    res.json({
      ok: true,
      photos,
      videos,
      files,
      audio,
      counts: {
        photos: photos.length,
        videos: videos.length,
        files: files.length,
        audio: audio.length,
      },
    });
  } catch (err) {
    console.error('Fetch conversation media failed:', err);
    res.status(500).json({ ok: false, error: 'Could not load conversation media.' });
  }
});

function inspectFileMediaType(file) {
  const mime = (file.mimetype || '').toLowerCase();
  const orig = (file.originalname || '').toLowerCase();
  const isAudio =
    orig.startsWith('voice-') ||
    mime.startsWith('audio/') ||
    orig.endsWith('.webm') ||
    orig.endsWith('.ogg') ||
    orig.endsWith('.wav') ||
    orig.endsWith('.mp3') ||
    orig.endsWith('.m4a') ||
    orig.endsWith('.aac') ||
    orig.endsWith('.opus') ||
    mime.includes('webm') ||
    mime.includes('ogg') ||
    mime.includes('wav');
  const isVideo = !isAudio && (mime.startsWith('video/') || orig.endsWith('.mp4') || orig.endsWith('.mov'));
  return isAudio ? 'audio' : (isVideo ? 'video' : 'image');
}

// Media: Upload Photo / Video / Audio (Voice Message)
app.post('/api/upload', authMiddleware, upload.single('media'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'No media file provided.' });
  }

  // Persist file into PostgreSQL so redeployments never lose it
  await persistMediaFile(req.file);

  const mediaType = inspectFileMediaType(req.file);
  const url = `${PREFIX}/static/uploads/${req.file.filename}`;

  res.json({
    ok: true,
    url,
    mediaType,
    mediaName: req.file.originalname,
    size: req.file.size,
  });
});

// Media: Upload Multiple Photos / Videos / Audio in one go
app.post('/api/upload-multiple', authMiddleware, upload.array('media', 20), async (req, res) => {
  const files = req.files || [];
  if (!files.length && req.file) files.push(req.file);
  if (!files.length) {
    return res.status(400).json({ ok: false, error: 'No media files provided.' });
  }

  for (const f of files) {
    await persistMediaFile(f);
  }

  const results = files.map((f) => ({
    url: `${PREFIX}/static/uploads/${f.filename}`,
    mediaType: inspectFileMediaType(f),
    mediaName: f.originalname,
    size: f.size,
  }));

  res.json({ ok: true, files: results });
});

// Messages: Edit (Telegram-style inline message editing)
app.patch('/api/messages/:id', authMiddleware, async (req, res) => {
  try {
    const msgId = Number(req.params.id);
    const newText = typeof req.body.text === 'string' ? req.body.text.trim() : '';

    if (!newText) {
      return res.status(400).json({ ok: false, error: 'Message text cannot be empty.' });
    }

    const { rows } = await pool.query(
      'SELECT id, conversation_id, sender_id, is_deleted FROM chat_messages WHERE id = $1',
      [msgId]
    );

    if (!rows.length || rows[0].is_deleted) {
      return res.status(404).json({ ok: false, error: 'Message not found.' });
    }

    const msg = rows[0];
    const isOwner = Number(msg.sender_id) === req.user.id;
    if (!isOwner && !req.user.is_admin) {
      return res.status(403).json({ ok: false, error: 'You can only edit your own messages.' });
    }

    await pool.query(
      'UPDATE chat_messages SET body = $1, is_edited = TRUE, edited_at = now() WHERE id = $2',
      [newText, msgId]
    );

    const editedAt = Date.now();
    // Broadcast edit in real time to conversation
    io.to(`c:${msg.conversation_id}`).emit('message_edited', {
      id: msgId,
      conversationId: Number(msg.conversation_id),
      text: newText,
      isEdited: true,
      editedAt,
    });

    res.json({
      ok: true,
      message: {
        id: msgId,
        conversationId: Number(msg.conversation_id),
        text: newText,
        isEdited: true,
        editedAt,
      },
    });
  } catch (err) {
    console.error('Edit message failed:', err);
    res.status(500).json({ ok: false, error: 'Could not edit message.' });
  }
});

// Messages: Delete (Telegram-style: gone without a trace)
app.delete('/api/messages/:id', authMiddleware, async (req, res) => {
  try {
    const msgId = Number(req.params.id);
    const { rows } = await pool.query(
      'SELECT id, conversation_id, sender_id, media_url, media_list FROM chat_messages WHERE id = $1',
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

    // Like Telegram: remove media files if present
    const filesToDelete = [];
    if (msg.media_url) filesToDelete.push(msg.media_url);
    if (msg.media_list) {
      try {
        const list = typeof msg.media_list === 'string' ? JSON.parse(msg.media_list) : msg.media_list;
        if (Array.isArray(list)) {
          list.forEach((m) => { if (m && m.url) filesToDelete.push(m.url); });
        }
      } catch {}
    }

    for (const mUrl of filesToDelete) {
      try {
        const parts = mUrl.split('/static/uploads/');
        if (parts.length > 1) {
          const fname = path.basename(parts[1]);
          const filePath = path.join(UPLOADS_DIR, fname);
          if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
          await pool.query('DELETE FROM chat_media_files WHERE filename = $1', [fname]).catch(() => {});
        }
      } catch (e) {}
    }

    // Hard delete - completely removed from database
    await pool.query('DELETE FROM chat_messages WHERE id = $1', [msgId]);

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
    const groupsRes = await pool.query("SELECT count(*)::int as count FROM chat_conversations WHERE type = 'group'");
    const directsRes = await pool.query("SELECT count(*)::int as count FROM chat_conversations WHERE type = 'direct'");

    res.json({
      ok: true,
      stats: {
        totalUsers: usersRes.rows[0].count,
        activeUsersOnline: onlineUsers.size,
        totalMessages: messagesRes.rows[0].count,
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

// Admin: Permanently Delete User Account (and delete their entire chat history & files)
app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const targetId = Number(req.params.id);

    if (targetId === req.user.id) {
      return res.status(400).json({ ok: false, error: 'You cannot delete your own admin account.' });
    }

    const targetUser = await getUserById(targetId);
    if (!targetUser) {
      return res.status(404).json({ ok: false, error: 'User not found.' });
    }

    // 1. Gather all files uploaded by this user in chat messages to unlink from disk
    const filesToDelete = [];
    if (targetUser.avatar_url) {
      filesToDelete.push(targetUser.avatar_url);
    }
    const userMsgsRes = await pool.query(
      'SELECT media_url, media_list FROM chat_messages WHERE sender_id = $1',
      [targetId]
    );
    for (const r of userMsgsRes.rows) {
      if (r.media_url) filesToDelete.push(r.media_url);
      if (r.media_list) {
        try {
          const list = typeof r.media_list === 'string' ? JSON.parse(r.media_list) : r.media_list;
          if (Array.isArray(list)) {
            list.forEach((m) => { if (m && m.url) filesToDelete.push(m.url); });
          }
        } catch {}
      }
    }

    // Also gather direct conversations where target user is participant to delete their files too
    const directConvsRes = await pool.query(
      `SELECT c.id FROM chat_conversations c
       JOIN chat_conversation_members m ON c.id = m.conversation_id
       WHERE c.type = 'direct' AND m.user_id = $1`,
      [targetId]
    );
    const directConvIds = directConvsRes.rows.map((r) => Number(r.id));
    if (directConvIds.length > 0) {
      const placeholders = directConvIds.map((_, i) => `$${i + 1}`).join(',');
      const directMsgsRes = await pool.query(
        `SELECT media_url, media_list FROM chat_messages WHERE conversation_id IN (${placeholders})`,
        directConvIds
      );
      for (const r of directMsgsRes.rows) {
        if (r.media_url) filesToDelete.push(r.media_url);
        if (r.media_list) {
          try {
            const list = typeof r.media_list === 'string' ? JSON.parse(r.media_list) : r.media_list;
            if (Array.isArray(list)) {
              list.forEach((m) => { if (m && m.url) filesToDelete.push(m.url); });
            }
          } catch {}
        }
      }
    }

    // Unlink all accumulated files from disk
    for (const mUrl of filesToDelete) {
      try {
        const parts = mUrl.split('/static/uploads/');
        if (parts.length > 1) {
          const fname = path.basename(parts[1]);
          const filePath = path.join(UPLOADS_DIR, fname);
          if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
          await pool.query('DELETE FROM chat_media_files WHERE filename = $1', [fname]).catch(() => {});
        }
      } catch (e) {}
    }

    // 2. Delete all direct conversations where this user participated
    if (directConvIds.length > 0) {
      const placeholders = directConvIds.map((_, i) => `$${i + 1}`).join(',');
      await pool.query(`DELETE FROM chat_conversations WHERE id IN (${placeholders})`, directConvIds);
    }

    // 3. Delete messages sent by user in remaining conversations (like groups)
    await pool.query('DELETE FROM chat_messages WHERE sender_id = $1', [targetId]);

    // 4. Delete friend requests and friends relationships
    await pool.query('DELETE FROM chat_friend_requests WHERE sender_id = $1 OR receiver_id = $1', [targetId]);
    await pool.query('DELETE FROM chat_friends WHERE user_id = $1 OR friend_id = $1', [targetId]);

    // 5. Delete group memberships
    await pool.query('DELETE FROM chat_conversation_members WHERE user_id = $1', [targetId]);

    // 6. Delete the user row
    await pool.query('DELETE FROM chat_users WHERE id = $1', [targetId]);

    // 7. Disconnect active sockets for this user immediately
    for (const [socketId, socket] of io.sockets.sockets) {
      if (socket.user && socket.user.id === targetId) {
        socket.emit('account_deleted');
        socket.disconnect(true);
      }
    }
    onlineUsers.delete(targetId);

    // Notify other connected clients to refresh conversations/friends
    io.emit('user_deleted', { userId: targetId });

    res.json({ ok: true, targetId, message: `User ${targetUser.name} and all their chat data were permanently deleted.` });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ ok: false, error: 'Could not delete user account.' });
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



// Admin: Change user role (promote to admin or demote to regular user)
app.post('/api/admin/users/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const targetId = Number(req.params.id);
    const isAdmin = Boolean(req.body.isAdmin);

    if (targetId === req.user.id && !isAdmin) {
      return res.status(400).json({ ok: false, error: 'You cannot remove your own admin status.' });
    }

    await pool.query('UPDATE chat_users SET is_admin = $1 WHERE id = $2', [isAdmin, targetId]);

    // Real-time notification to user
    io.to(`u:${targetId}`).emit('role_changed', { isAdmin });

    res.json({ ok: true, targetId, isAdmin });
  } catch (err) {
    console.error('Change user role error:', err);
    res.status(500).json({ ok: false, error: 'Could not update user role.' });
  }
});

// Auth: Claim admin privileges (with admin code or if no other admin exists)
app.post('/api/auth/claim-admin', authMiddleware, async (req, res) => {
  try {
    const code = String(req.body.code || '').trim();
    const adminCountRes = await pool.query('SELECT count(*)::int as count FROM chat_users WHERE is_admin = TRUE');
    const hasAdmins = adminCountRes.rows[0].count > 0;

    const validCodes = ['admin', 'admin123', 'chatboxadmin'];
    if (process.env.ADMIN_KEY) validCodes.push(process.env.ADMIN_KEY.trim());
    if (process.env.ADMIN_CODE) validCodes.push(process.env.ADMIN_CODE.trim());

    const isAuthorized = !hasAdmins || validCodes.includes(code);
    if (!isAuthorized) {
      return res.status(403).json({ ok: false, error: 'Invalid admin authorization code.' });
    }

    await pool.query('UPDATE chat_users SET is_admin = TRUE WHERE id = $1', [req.user.id]);
    const updated = await getUserById(req.user.id);

    // Notify user socket
    io.to(`u:${req.user.id}`).emit('role_changed', { isAdmin: true });

    res.json({ ok: true, user: updated, message: 'You have been granted administrator access!' });
  } catch (err) {
    console.error('Claim admin error:', err);
    res.status(500).json({ ok: false, error: 'Could not claim admin status.' });
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

      const msg = {
        id: Number(msgRes.rows[0].id),
        tempId,
        conversationId: convId,
        senderId: user.id,
        senderName: user.name,
        text,
        mediaUrl,
        mediaType,
        mediaName,
        mediaList: mediaList || (mediaUrl ? [{ url: mediaUrl, mediaType, mediaName }] : null),
        replyToId,
        replyToSender,
        replyToText,
        status: initialStatus,
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
      if (mediaList && mediaList.length > 1) {
        snippetText = `📷 ${mediaList.length} media files`;
      } else if (mediaType === 'audio') {
        snippetText = '🎤 Voice note';
      } else if (mediaType === 'image') {
        snippetText = '📷 Photo';
      } else if (mediaType === 'video') {
        snippetText = '🎥 Video';
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

  // Message delivered acknowledgment
  socket.on('message_delivered', async ({ messageId, conversationId }) => {
    const msgId = Number(messageId);
    if (!msgId) return;
    try {
      const res = await pool.query(
        "UPDATE chat_messages SET status = 'delivered' WHERE id = $1 AND status = 'sent' RETURNING sender_id, conversation_id",
        [msgId]
      );
      if (res.rows.length) {
        const senderId = Number(res.rows[0].sender_id);
        const cId = Number(res.rows[0].conversation_id);
        io.to(`u:${senderId}`).emit('message_status_update', { messageId: msgId, status: 'delivered', conversationId: cId });
      }
    } catch (e) {}
  });

  // Conversation seen acknowledgment
  socket.on('conversation_seen', async ({ conversationId }) => {
    const convId = Number(conversationId);
    if (!convId) return;
    try {
      const res = await pool.query(
        "UPDATE chat_messages SET status = 'seen' WHERE conversation_id = $1 AND sender_id != $2 AND status != 'seen'",
        [convId, user.id]
      );
      if (res.rowCount > 0) {
        io.to(`c:${convId}`).emit('conversation_seen', { conversationId: convId, seenBy: user.id });
      }
    } catch (e) {}
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
