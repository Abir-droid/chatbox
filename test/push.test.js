'use strict';

const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const pushService = require('../push');
const { getPool, initDatabase } = require('../server');

describe('Push Notifications & Device Token Management', () => {
  let pool;

  before(async () => {
    await initDatabase();
    pool = getPool();
  });

  test('registers and updates device token', async () => {
    // Insert a dummy user first
    const userRes = await pool.query(
      `INSERT INTO chat_users (phone, name, password_hash)
       VALUES ('+19998887777', 'Push Test User', 'hash123')
       ON CONFLICT (phone) DO UPDATE SET name = 'Push Test User'
       RETURNING id`
    );
    const userId = Number(userRes.rows[0].id);

    // Register token
    const testToken = 'fcm_test_token_abc_123';
    await pushService.registerToken(pool, userId, testToken, 'android');

    const check = await pool.query(
      'SELECT token, platform FROM chat_device_tokens WHERE user_id = $1',
      [userId]
    );
    assert.equal(check.rows.length, 1);
    assert.equal(check.rows[0].token, testToken);
    assert.equal(check.rows[0].platform, 'android');

    // Registering the same token updates it without error
    await pushService.registerToken(pool, userId, testToken, 'android');
    const check2 = await pool.query(
      'SELECT token FROM chat_device_tokens WHERE user_id = $1',
      [userId]
    );
    assert.equal(check2.rows.length, 1);

    // Unregister token
    await pushService.unregisterToken(pool, userId, testToken);
    const check3 = await pool.query(
      'SELECT token FROM chat_device_tokens WHERE user_id = $1',
      [userId]
    );
    assert.equal(check3.rows.length, 0);
  });
});
