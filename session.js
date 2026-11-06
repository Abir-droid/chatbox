'use strict';

const crypto = require('node:crypto');

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 60 * 1000;

function createSessionAuth(secret, { now = Date.now, ttlMs = SESSION_TTL_MS } = {}) {
  if (typeof secret !== 'string' || secret.length < 32) {
    throw new Error('Session secret must be at least 32 characters.');
  }

  function generateToken(userId) {
    const id = Number(userId);
    if (!Number.isSafeInteger(id) || id <= 0) throw new TypeError('Invalid user id.');
    const payload = `${id}:${now()}`;
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return Buffer.from(`${payload}:${signature}`).toString('base64url');
  }

  function parseToken(token) {
    try {
      if (typeof token !== 'string' || !/^[A-Za-z0-9_-]+$/.test(token)) return null;
      const raw = Buffer.from(token, 'base64url').toString('utf8');
      const match = /^(\d+):(\d+):([a-f0-9]{64})$/.exec(raw);
      if (!match) return null;

      const userId = Number(match[1]);
      const issuedAt = Number(match[2]);
      const currentTime = now();
      if (!Number.isSafeInteger(userId) || userId <= 0 || !Number.isSafeInteger(issuedAt)) return null;
      if (issuedAt > currentTime + MAX_FUTURE_SKEW_MS || currentTime - issuedAt > ttlMs) return null;

      const payload = `${match[1]}:${match[2]}`;
      const expected = crypto.createHmac('sha256', secret).update(payload).digest();
      const received = Buffer.from(match[3], 'hex');
      if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null;
      return userId;
    } catch {
      return null;
    }
  }

  return { generateToken, parseToken };
}

module.exports = { createSessionAuth, SESSION_TTL_MS };
