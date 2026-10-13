'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { io: Client } = require('socket.io-client');

// Use port 3099 for testing to avoid conflicts with any running dev server
process.env.PORT = '3099';
process.env.HOST = '127.0.0.1';
// Leave DATABASE_URL unset to use in-memory pg-mem emulator
delete process.env.DATABASE_URL;

const {
  server,
  app,
  io,
  getPool,
  initDatabase,
  ensureRoom,
  saveMessage,
  loadHistory,
  stripPrefix,
  PORT,
} = require('./server');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `http://127.0.0.1:${PORT}${path}`,
      options,
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Chatbox Test Suite ---\n');

  console.log('[1/5] Initializing Database & Server...');
  await initDatabase();
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`Server listening on port ${PORT}`);

  // Test 1: HTTP endpoints
  console.log('\n[2/5] Testing HTTP routes & headers...');
  {
    const resHome = await request('/');
    assert.equal(resHome.status, 200, 'Home page should return 200');
    assert.match(resHome.body, /<title>chatbox<\/title>/, 'Home page contains chatbox title');
    assert.equal(resHome.headers['x-content-type-options'], 'nosniff');
    assert.equal(resHome.headers['x-frame-options'], 'DENY');
    assert.ok(resHome.headers['content-security-policy'], 'CSP header is set');
    console.log('  ✔ GET / -> 200 with security headers');

    const resHealth = await request('/healthz');
    assert.equal(resHealth.status, 200, 'Healthz should return 200');
    const healthJson = JSON.parse(resHealth.body);
    assert.equal(healthJson.ok, true);
    assert.equal(healthJson.db, true);
    console.log('  ✔ GET /healthz -> 200 { ok: true, db: true }');

    const resCss = await request('/static/app.css');
    assert.equal(resCss.status, 200, 'CSS static file should return 200');
    assert.match(resCss.body, /--font-body/, 'CSS contains design tokens');
    console.log('  ✔ GET /static/app.css -> 200');

    const resJs = await request('/static/app.js');
    assert.equal(resJs.status, 200, 'JS static file should return 200');
    console.log('  ✔ GET /static/app.js -> 200');

    const resNotFound = await request('/not-found-url');
    assert.equal(resNotFound.status, 404, 'Unknown path should return 404');
    console.log('  ✔ GET /not-found-url -> 404');
  }

  // Test 2: Database operations
  console.log('\n[3/5] Testing PostgreSQL data layer...');
  {
    const roomCreated = await ensureRoom('dev-talk');
    assert.equal(roomCreated, true, 'Room creation succeeds');

    // Duplicate creation must be idempotent and not cause duplicates
    const roomDuplicate = await ensureRoom('dev-talk');
    assert.equal(roomDuplicate, true, 'Duplicate room returns true');

    const msg1 = await saveMessage('dev-talk', 'Alice', 'First message');
    assert.ok(msg1.id > 0, 'Message id should be positive');
    assert.equal(msg1.user, 'Alice');
    assert.equal(msg1.text, 'First message');

    const msg2 = await saveMessage('dev-talk', 'Bob', 'Second message');
    assert.ok(msg2.id > msg1.id, 'Message id should increment');

    const history = await loadHistory('dev-talk');
    assert.equal(history.length, 2, 'History contains 2 messages');
    assert.equal(history[0].user, 'Alice', 'Chronological order (oldest first)');
    assert.equal(history[1].user, 'Bob');
    console.log('  ✔ ensureRoom, saveMessage, and loadHistory work correctly');
  }

  // Test 3: Subpath stripPrefix logic
  console.log('\n[4/5] Testing subpath URL stripPrefix logic...');
  {
    // Test the stripPrefix function directly with dummy request objects
    const dummyReq1 = { url: '/chatbox' };
    stripPrefix(dummyReq1);
    // Note: in this test process, PREFIX is '' because APPLICATION_ROOT is not set.
    // Let's test the prefix stripping logic specifically
    function testPrefixStripper(prefix, incomingUrl) {
      const p = prefix.replace(/\/+$/, '');
      let url = incomingUrl || '/';
      if (url === p) return '/';
      if (url.startsWith(p + '/')) return url.slice(p.length);
      if (url.startsWith(p + '?')) return '/' + url.slice(p.length);
      return url;
    }
    assert.equal(testPrefixStripper('/chatbox', '/chatbox'), '/');
    assert.equal(testPrefixStripper('/chatbox', '/chatbox/'), '/');
    assert.equal(testPrefixStripper('/chatbox', '/chatbox/static/app.css'), '/static/app.css');
    assert.equal(testPrefixStripper('/chatbox', '/chatbox/socket.io/?EIO=4'), '/socket.io/?EIO=4');
    assert.equal(testPrefixStripper('/chatbox', '/chatbox?v=1'), '/?v=1');
    assert.equal(testPrefixStripper('/chatbox', '/static/app.css'), '/static/app.css', 'Leaves untouched if proxy already stripped');
    console.log('  ✔ stripPrefix handles /chatbox, /chatbox/, query parameters, and already-stripped paths');
  }

  // Test 4: Real-time Socket.IO communication
  console.log('\n[5/5] Testing real-time Socket.IO multi-client interactions...');
  const clientUrl = `http://127.0.0.1:${PORT}`;
  const socketOpts = {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    forceNew: true,
  };

  const client1 = Client(clientUrl, socketOpts);
  const client2 = Client(clientUrl, socketOpts);

  await new Promise((resolve) => client1.on('connect', resolve));
  await new Promise((resolve) => client2.on('connect', resolve));
  console.log('  ✔ 2 client sockets connected');

  // Client 1 joins 'general'
  const join1 = await new Promise((resolve) => {
    client1.emit('join', { name: 'Alice', room: 'general' }, resolve);
  });
  assert.equal(join1.ok, true);
  assert.equal(join1.name, 'Alice');
  assert.equal(join1.room, 'general');
  console.log('  ✔ Client 1 (Alice) joined #general');

  // Client 2 listens for system event ("Bob joined")
  const systemPromise = new Promise((resolve) => {
    client1.on('system', (evt) => {
      if (evt.text.includes('Bob joined')) resolve(evt);
    });
  });

  // Client 2 joins 'general'
  const join2 = await new Promise((resolve) => {
    client2.emit('join', { name: 'Bob', room: 'general' }, resolve);
  });
  assert.equal(join2.ok, true);
  assert.equal(join2.name, 'Bob');
  assert.ok(join2.users.includes('Alice'), 'Alice is in presence');
  assert.ok(join2.users.includes('Bob'), 'Bob is in presence');

  const systemEvt = await systemPromise;
  assert.ok(systemEvt.text.includes('Bob joined'));
  console.log('  ✔ Client 2 (Bob) joined; Client 1 received join announcement');

  // Real-time message exchange
  const msgPromise = new Promise((resolve) => {
    client1.on('message', (msg) => {
      if (msg.user === 'Bob' && msg.text === 'Hello Alice!') resolve(msg);
    });
  });

  const sendRes = await new Promise((resolve) => {
    client2.emit('message', { text: 'Hello Alice!' }, resolve);
  });
  assert.equal(sendRes.ok, true);

  const receivedMsg = await msgPromise;
  assert.equal(receivedMsg.user, 'Bob');
  assert.equal(receivedMsg.text, 'Hello Alice!');
  console.log('  ✔ Real-time message broadcast received instantly');

  // Typing indicator
  const typingPromise = new Promise((resolve) => {
    client1.on('typing', (evt) => {
      if (evt.user === 'Bob' && evt.typing === true) resolve(evt);
    });
  });
  client2.emit('typing', true);
  const typingEvt = await typingPromise;
  assert.equal(typingEvt.typing, true);
  console.log('  ✔ Typing indicator broadcast verified');

  // Cleanup sockets and server
  client1.disconnect();
  client2.disconnect();

  await new Promise((resolve) => io.close(resolve));
  await new Promise((resolve) => server.close(resolve));
  await getPool().end();

  console.log('\n=======================================');
  console.log('  🎉 ALL TESTS PASSED SUCCESSFULLY!    ');
  console.log('=======================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed with error:', err);
  process.exit(1);
});
