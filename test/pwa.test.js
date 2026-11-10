'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

const { app } = require('../server');

test('PWA static icons exist and are valid PNG / SVG files', () => {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  assert.ok(fs.existsSync(iconsDir), 'icons directory must exist');

  const requiredIcons = [
    'icon-192.png',
    'icon-512.png',
    'apple-touch-icon.png',
    'icon-maskable-192.png',
    'icon-maskable-512.png',
    'icon.svg',
    'icon-maskable.svg'
  ];

  for (const filename of requiredIcons) {
    const filePath = path.join(iconsDir, filename);
    assert.ok(fs.existsSync(filePath), `Icon file ${filename} must exist`);
    const stat = fs.statSync(filePath);
    assert.ok(stat.size > 0, `Icon file ${filename} must not be empty`);

    if (filename.endsWith('.png')) {
      const buf = fs.readFileSync(filePath);
      // Check PNG magic bytes: \x89 P N G \r \n \x1a \n
      const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      assert.ok(
        buf.subarray(0, 8).equals(pngHeader),
        `${filename} must be a valid PNG file with standard magic header`
      );
    }
  }
});

test('views/index.html includes all modern PWA meta tags and link tags', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'views', 'index.html'), 'utf8');

  // Manifest link
  assert.ok(indexHtml.includes('rel="manifest"'), 'Must link to manifest.webmanifest');
  // Mobile web app capable (standard + iOS)
  assert.ok(indexHtml.includes('name="mobile-web-app-capable"'), 'Must have mobile-web-app-capable meta');
  assert.ok(indexHtml.includes('name="apple-mobile-web-app-capable"'), 'Must have apple-mobile-web-app-capable meta');
  assert.ok(indexHtml.includes('name="apple-mobile-web-app-status-bar-style"'), 'Must have apple status-bar-style meta');
  assert.ok(indexHtml.includes('name="apple-mobile-web-app-title"'), 'Must have apple-mobile-web-app-title meta');
  // Apple touch icon
  assert.ok(indexHtml.includes('rel="apple-touch-icon"'), 'Must have apple-touch-icon link');
  // Theme color
  assert.ok(indexHtml.includes('name="theme-color"'), 'Must have theme-color meta tag');
  // Viewport-fit=cover
  assert.ok(indexHtml.includes('viewport-fit=cover'), 'Viewport must include viewport-fit=cover');
  // In-app install button and install dialog
  assert.ok(indexHtml.includes('id="install-pwa-btn"'), 'Must have install PWA button');
  assert.ok(indexHtml.includes('id="install-dialog"'), 'Must have install dialog');
  // Mobile camera flip button
  assert.ok(indexHtml.includes('id="call-flip-cam-btn"'), 'Must have call camera flip button');
});

test('Web App Manifest endpoint serves valid JSON with proper headers and icons', async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/manifest.webmanifest`);
    assert.equal(res.status, 200);
    const contentType = res.headers.get('content-type');
    assert.ok(
      contentType.includes('application/manifest+json') || contentType.includes('application/json'),
      `Content-type should be manifest+json, got: ${contentType}`
    );

    const manifest = await res.json();
    assert.equal(manifest.name, 'Chatbox');
    assert.equal(manifest.short_name, 'Chatbox');
    assert.equal(manifest.display, 'standalone');
    assert.ok(manifest.start_url, 'Must have start_url');
    assert.ok(manifest.scope, 'Must have scope');
    assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 4, 'Must have icons array');

    const has192 = manifest.icons.some((i) => i.sizes === '192x192' && i.purpose === 'any');
    const has512 = manifest.icons.some((i) => i.sizes === '512x512' && i.purpose === 'any');
    const hasMaskable = manifest.icons.some((i) => i.purpose === 'maskable');
    assert.ok(has192, 'Manifest must have 192x192 any icon');
    assert.ok(has512, 'Manifest must have 512x512 any icon');
    assert.ok(hasMaskable, 'Manifest must have maskable icon');
  } finally {
    server.close();
  }
});

test('Service Worker endpoint serves with Service-Worker-Allowed header and no-cache', async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/sw.js`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('service-worker-allowed'), '/');
    const cacheCtrl = res.headers.get('cache-control');
    assert.ok(cacheCtrl.includes('no-cache'), 'Cache-Control must specify no-cache');

    const js = await res.text();
    assert.ok(js.includes('CACHE_NAME'), 'SW should contain CACHE_NAME');
    assert.ok(js.includes('addEventListener'), 'SW should have event listeners');
    assert.ok(js.includes('notificationclick'), 'SW should handle notification click');
  } finally {
    server.close();
  }
});

test('Offline fallback page endpoint serves valid HTML with status 200', async () => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  try {
    const res = await fetch(`http://127.0.0.1:${port}/offline.html`);
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('Offline') || text.includes('offline'), 'Should contain offline message');
  } finally {
    server.close();
  }
});

test('Subpath templating generates correct manifest URLs under subpath', () => {
  const manifestTemplate = fs.readFileSync(path.join(__dirname, '..', 'public', 'manifest.webmanifest'), 'utf8');
  const subpath = '/chatbox';
  const resolved = JSON.parse(manifestTemplate.replaceAll('{{BASE}}', subpath));

  assert.equal(resolved.start_url, '/chatbox/?source=pwa');
  assert.equal(resolved.scope, '/chatbox/');
  assert.equal(resolved.id, '/chatbox/?source=pwa');
  assert.ok(resolved.icons.every((icon) => icon.src.startsWith('/chatbox/static/')));
  assert.ok(resolved.shortcuts.every((sc) => sc.url.startsWith('/chatbox/')));
});

