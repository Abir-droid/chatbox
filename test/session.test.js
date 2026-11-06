'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createSessionAuth } = require('../session');

const SECRET = 'unit-test-session-secret-with-more-than-32-characters';

test('session tokens round-trip a positive user id', () => {
  const auth = createSessionAuth(SECRET, { now: () => 1_800_000_000_000 });
  const token = auth.generateToken(42);
  assert.equal(auth.parseToken(token), 42);
});

test('session tokens reject altered signatures', () => {
  const auth = createSessionAuth(SECRET, { now: () => 1_800_000_000_000 });
  const token = auth.generateToken(42);
  const altered = `${token.slice(0, -1)}${token.endsWith('A') ? 'B' : 'A'}`;
  assert.equal(auth.parseToken(altered), null);
});

test('session tokens expire after the configured lifetime', () => {
  let currentTime = 1_800_000_000_000;
  const auth = createSessionAuth(SECRET, { now: () => currentTime, ttlMs: 1_000 });
  const token = auth.generateToken(42);
  currentTime += 1_001;
  assert.equal(auth.parseToken(token), null);
});

test('session tokens reject issue times too far in the future', () => {
  let currentTime = 1_800_000_000_000;
  const auth = createSessionAuth(SECRET, { now: () => currentTime });
  const token = auth.generateToken(42);
  currentTime -= 60_001;
  assert.equal(auth.parseToken(token), null);
});
