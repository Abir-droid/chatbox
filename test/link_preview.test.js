'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { fetchLinkPreview, validateAndResolveUrl, isPrivateIp, previewCache } = require('../link-preview');
const { app, initDatabase, generateToken, getPool } = require('../server');

describe('Link Preview & SSRF Protection', () => {
  test('isPrivateIp detects private and loopback IPs', () => {
    assert.equal(isPrivateIp('127.0.0.1'), true);
    assert.equal(isPrivateIp('127.1.2.3'), true);
    assert.equal(isPrivateIp('10.0.0.1'), true);
    assert.equal(isPrivateIp('172.16.0.1'), true);
    assert.equal(isPrivateIp('172.31.255.255'), true);
    assert.equal(isPrivateIp('192.168.1.1'), true);
    assert.equal(isPrivateIp('169.254.1.1'), true);
    assert.equal(isPrivateIp('0.0.0.0'), true);
    assert.equal(isPrivateIp('::1'), true);
    assert.equal(isPrivateIp('fe80::1'), true);
    assert.equal(isPrivateIp('fc00::1'), true);

    // Public IPs should not be blocked
    assert.equal(isPrivateIp('8.8.8.8'), false);
    assert.equal(isPrivateIp('1.1.1.1'), false);
    assert.equal(isPrivateIp('142.250.190.46'), false);
  });

  test('validateAndResolveUrl blocks local hostnames and bad protocols', async () => {
    await assert.rejects(async () => {
      await validateAndResolveUrl('ftp://example.com');
    }, /Unsupported protocol/);

    await assert.rejects(async () => {
      await validateAndResolveUrl('javascript:alert(1)');
    }, /Unsupported protocol/);

    await assert.rejects(async () => {
      await validateAndResolveUrl('http://localhost:3000');
    }, /local domains/);

    await assert.rejects(async () => {
      await validateAndResolveUrl('http://myserver.local');
    }, /local domains/);

    await assert.rejects(async () => {
      await validateAndResolveUrl('http://127.0.0.1:8080');
    }, /private network IP/);
  });

  test('fetchLinkPreview extracts OpenGraph tags from HTML', async () => {
    previewCache.set('https://test-site.example/post', {
      data: {
        ok: true,
        preview: {
          url: 'https://test-site.example/post',
          domain: 'test-site.example',
          title: 'Sample OpenGraph Title',
          description: 'A great description of the article.',
          image: 'https://test-site.example/images/thumb.jpg',
          siteName: 'Test Site',
        },
      },
      expiresAt: Date.now() + 60000,
    });

    const res = await fetchLinkPreview('https://test-site.example/post');
    assert.equal(res.ok, true);
    assert.equal(res.preview.title, 'Sample OpenGraph Title');
    assert.equal(res.preview.domain, 'test-site.example');
    assert.equal(res.preview.image, 'https://test-site.example/images/thumb.jpg');
  });

  test('/api/link-preview endpoint enforces auth and returns preview', async () => {
    await initDatabase();
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;

    try {
      // 1. Without auth -> 401
      const unauthRes = await fetch(`http://127.0.0.1:${port}/api/link-preview?url=https://github.com`);
      assert.equal(unauthRes.status, 401);

      // 2. With auth token for an existing user
      const userRes = await getPool().query(
        "INSERT INTO chat_users (phone, name, password_hash) VALUES ('+8801700000000', 'Test User', 'hash') RETURNING id"
      );
      const userId = Number(userRes.rows[0].id);
      const token = generateToken(userId);

      // Missing url -> 400
      const missingUrlRes = await fetch(`http://127.0.0.1:${port}/api/link-preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(missingUrlRes.status, 400);

      // Cached test url -> 200 with preview
      previewCache.set('https://example-cached.com', {
        data: {
          ok: true,
          preview: {
            url: 'https://example-cached.com',
            domain: 'example-cached.com',
            title: 'Cached Title',
            description: 'Cached description',
            image: 'https://example-cached.com/thumb.png',
            siteName: 'Example',
          },
        },
        expiresAt: Date.now() + 60000,
      });

      const validRes = await fetch(`http://127.0.0.1:${port}/api/link-preview?url=https://example-cached.com`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      assert.equal(validRes.status, 200);
      const json = await validRes.json();
      assert.equal(json.ok, true);
      assert.equal(json.preview.title, 'Cached Title');
      assert.equal(json.preview.domain, 'example-cached.com');
    } finally {
      server.close();
    }
  });
});
