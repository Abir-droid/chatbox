'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { io: Client } = require('socket.io-client');

process.env.PORT = '3299';
process.env.HOST = '127.0.0.1';
delete process.env.DATABASE_URL;

const {
  server,
  app,
  io,
  initDatabase,
  PORT,
} = require('./server');

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(`http://127.0.0.1:${PORT}${path}`);
    const reqOpts = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOpts, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, body, json });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function run() {
  console.log('--- Testing Seen/Unseen Ticks, Status Transitions & Delivery ---\n');
  await initDatabase();
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

  // 1. Register User A & User B
  const regA = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { name: 'User A', phone: '+8801911111111', password: 'password123' },
  });
  const tokenA = regA.json.token;
  const userA = regA.json.user;

  const regB = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { name: 'User B', phone: '+8801922222222', password: 'password123' },
  });
  const tokenB = regB.json.token;
  const userB = regB.json.user;

  // Add friend so they can chat
  await request('/api/friends/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: { phone: userB.phone },
  });

  // Create direct conversation
  const convRes = await request('/api/conversations/direct', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: { phone: userB.phone },
  });
  const convId = convRes.json.conversation.id;

  // Connect socket for User A only (User B is currently offline)
  const socketA = Client(`http://127.0.0.1:${PORT}`, {
    auth: { token: tokenA },
    transports: ['websocket'],
  });
  await new Promise((resolve) => socketA.on('connect', resolve));

  // User A sends message when User B is offline -> status MUST be 'sent'
  let message1Id = null;
  await new Promise((resolve) => {
    socketA.emit('message', {
      conversationId: convId,
      text: 'Message while you are offline',
    });
    socketA.once('message', (msg) => {
      message1Id = msg.id;
      assert.strictEqual(msg.status, 'sent', 'Status should be "sent" when recipient is offline');
      console.log('  ✔ Message 1 sent while recipient offline: status is "sent"');
      resolve();
    });
  });

  // User B connects socket (comes online)
  const socketB = Client(`http://127.0.0.1:${PORT}`, {
    auth: { token: tokenB },
    transports: ['websocket'],
  });
  await new Promise((resolve) => socketB.on('connect', resolve));

  // User B acknowledges delivery of message 1
  const deliveryPromise = new Promise((resolve) => {
    socketA.once('message_status_update', (data) => {
      assert.strictEqual(data.messageId, message1Id);
      assert.strictEqual(data.status, 'delivered');
      console.log('  ✔ Socket delivery acknowledgment: message 1 transitioned from "sent" to "delivered"');
      resolve();
    });
  });

  socketB.emit('message_delivered', { messageId: message1Id, conversationId: convId });
  await deliveryPromise;

  // User A sends message 2 while User B is connected online -> status MUST be 'delivered'
  let message2Id = null;
  await new Promise((resolve) => {
    socketA.emit('message', {
      conversationId: convId,
      text: 'Message while you are online',
    });
    socketB.once('message', (msg) => {
      message2Id = msg.id;
      assert.strictEqual(msg.status, 'delivered', 'Initial status should be "delivered" when recipient is online');
      console.log('  ✔ Message 2 sent while recipient online: status is "delivered"');
      resolve();
    });
  });

  // User B opens conversation and fetches messages -> marks as 'seen'
  const seenPromise = new Promise((resolve) => {
    socketA.once('conversation_seen', (data) => {
      assert.strictEqual(data.conversationId, convId);
      console.log('  ✔ Conversation seen event broadcast to sender');
      resolve();
    });
  });

  const getMsgsRes = await request(`/api/conversations/${convId}/messages`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert.strictEqual(getMsgsRes.status, 200);
  await seenPromise;

  // Verify that all messages in conversation for User A are now marked as 'seen'
  const checkMsgsRes = await request(`/api/conversations/${convId}/messages`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const msgs = checkMsgsRes.json.messages;
  const m1 = msgs.find((m) => m.id === message1Id);
  const m2 = msgs.find((m) => m.id === message2Id);
  assert.strictEqual(m1.status, 'seen', 'Message 1 must be seen');
  assert.strictEqual(m2.status, 'seen', 'Message 2 must be seen');
  console.log('  ✔ All messages verified as "seen" (double blue tick state)');

  socketA.disconnect();
  socketB.disconnect();

  console.log('\n======================================================');
  console.log('  🎉 TICKS & REAL-TIME STATUS TESTS PASSED!  ');
  console.log('======================================================\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
