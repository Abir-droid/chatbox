'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { io: Client } = require('socket.io-client');

process.env.PORT = '3199';
process.env.HOST = '127.0.0.1';
delete process.env.DATABASE_URL;

const {
  server,
  app,
  io,
  getPool,
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
  console.log('--- Testing Reply Feature & Media Limit Removal ---\n');
  await initDatabase();
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

  // 1. Register Alice and Bob
  const regAlice = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { name: 'Alice', phone: '+1111111111', password: 'password123' },
  });
  const tokenAlice = regAlice.json.token;
  const userAlice = regAlice.json.user;

  const regBob = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { name: 'Bob', phone: '+2222222222', password: 'password123' },
  });
  const tokenBob = regBob.json.token;
  const userBob = regBob.json.user;

  // 2. Add as mutual friends
  await request('/api/friends/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAlice}` },
    body: { phone: '+2222222222' },
  });

  // 3. Create direct conversation
  const dmRes = await request('/api/conversations/direct', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAlice}` },
    body: { phone: '+2222222222' },
  });
  const convId = dmRes.json.conversation.id;

  // 4. Connect sockets
  const clientAlice = Client(`http://127.0.0.1:${PORT}`, {
    auth: { token: tokenAlice },
    transports: ['websocket'],
  });
  const clientBob = Client(`http://127.0.0.1:${PORT}`, {
    auth: { token: tokenBob },
    transports: ['websocket'],
  });

  await new Promise((res) => clientAlice.on('connect', res));
  await new Promise((res) => clientBob.on('connect', res));

  // Alice sends original message
  const msg1Promise = new Promise((resolve) => {
    clientAlice.emit(
      'message',
      { conversationId: convId, text: 'Hello Alice!' },
      (ack) => resolve(ack)
    );
  });
  const msg1Ack = await msg1Promise;
  assert.equal(msg1Ack.ok, true);
  const msg1Id = msg1Ack.id;

  // Bob replies to Alice's message
  let bobReceivedReply = null;
  clientAlice.on('message', (m) => {
    if (m.replyToId) bobReceivedReply = m;
  });

  const replyPromise = new Promise((resolve) => {
    clientBob.emit(
      'message',
      {
        conversationId: convId,
        text: 'This is my text reply to your message!',
        replyToId: msg1Id,
        replyToSender: 'Alice',
        replyToText: 'Hello Alice!',
      },
      (ack) => resolve(ack)
    );
  });
  const replyAck = await replyPromise;
  assert.equal(replyAck.ok, true);

  // Wait brief moment for socket broadcast
  await new Promise((r) => setTimeout(r, 200));

  assert.ok(bobReceivedReply, 'Alice should receive socket broadcast of reply message');
  assert.equal(bobReceivedReply.replyToId, msg1Id);
  assert.equal(bobReceivedReply.replyToSender, 'Alice');
  assert.equal(bobReceivedReply.replyToText, 'Hello Alice!');
  console.log('  ✔ Socket broadcast delivered reply message with replyToId, replyToSender, replyToText');

  // Verify message history contains reply fields
  const histRes = await request(`/api/conversations/${convId}/messages`, {
    headers: { Authorization: `Bearer ${tokenAlice}` },
  });
  assert.equal(histRes.status, 200);
  assert.equal(histRes.json.messages.length, 2);
  const replyMsgInHist = histRes.json.messages[1];
  assert.equal(replyMsgInHist.replyToId, msg1Id);
  assert.equal(replyMsgInHist.replyToSender, 'Alice');
  assert.equal(replyMsgInHist.replyToText, 'Hello Alice!');
  console.log('  ✔ Message history successfully preserved and returned replyTo metadata');

  // 5. Test multiple media upload endpoint
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const file1Content = 'fake image bytes 1';
  const file2Content = 'fake video bytes 2';
  let multiBody = '';
  multiBody += `--${boundary}\r\n`;
  multiBody += `Content-Disposition: form-data; name="media"; filename="photo1.png"\r\n`;
  multiBody += `Content-Type: image/png\r\n\r\n`;
  multiBody += file1Content + '\r\n';
  multiBody += `--${boundary}\r\n`;
  multiBody += `Content-Disposition: form-data; name="media"; filename="clip2.mp4"\r\n`;
  multiBody += `Content-Type: video/mp4\r\n\r\n`;
  multiBody += file2Content + '\r\n';
  multiBody += `--${boundary}--\r\n`;

  const uploadMultipleRes = await request('/api/upload-multiple', {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Authorization: `Bearer ${tokenAlice}`,
    },
    body: multiBody,
  });

  assert.equal(uploadMultipleRes.status, 200);
  assert.equal(uploadMultipleRes.json.ok, true);
  assert.equal(uploadMultipleRes.json.files.length, 2);
  assert.equal(uploadMultipleRes.json.files[0].mediaType, 'image');
  assert.equal(uploadMultipleRes.json.files[1].mediaType, 'video');
  console.log('  ✔ POST /api/upload-multiple successfully accepted and processed multiple media files in one go');

  clientAlice.disconnect();
  clientBob.disconnect();
  await new Promise((res) => server.close(res));

  console.log('\n======================================================');
  console.log('  🎉 REPLY & MEDIA TESTS PASSED SUCCESSFULLY!  ');
  console.log('======================================================\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
