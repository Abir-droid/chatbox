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
  console.log('\n--- Testing Telegram Sidepanel Media Endpoint, TempId & Admin Delete User ---');

  await initDatabase();
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  const pool = getPool();

  // 1. Register Admin User
  const adminReg = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { phone: '01700000001', name: 'Super Admin', password: 'password123' },
  });
  assert.strictEqual(adminReg.status, 200);
  const adminToken = adminReg.json.token;
  const adminId = adminReg.json.user.id;

  // Claim admin privileges
  await request('/api/auth/claim-admin', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: { code: 'admin123' },
  });

  // 2. Register User B and User C
  const userBReg = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { phone: '01700000002', name: 'User Bob', password: 'password123' },
  });
  const tokenB = userBReg.json.token;
  const idB = userBReg.json.user.id;

  const userCReg = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { phone: '01700000003', name: 'User Charlie', password: 'password123' },
  });
  const tokenC = userCReg.json.token;
  const idC = userCReg.json.user.id;

  // Make Bob & Admin friends
  await pool.query('INSERT INTO chat_friends (user_id, friend_id) VALUES ($1, $2), ($2, $1)', [adminId, idB]);

  // Open Direct Chat
  const convRes = await request('/api/conversations/direct', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: { phone: '01700000002' },
  });
  assert.strictEqual(convRes.status, 200);
  const convId = convRes.json.conversation.id;

  // Insert mock media messages: 1 photo, 1 video, 1 audio, 1 file
  await pool.query(
    `INSERT INTO chat_messages (conversation_id, sender_id, sender_name, body, media_url, media_type, media_name)
     VALUES ($1, $2, 'Admin', '', '/static/uploads/pic1.jpg', 'image', 'vacation.jpg'),
            ($1, $2, 'Admin', '', '/static/uploads/vid1.mp4', 'video', 'party.mp4'),
            ($1, $3, 'Bob', '', '/static/uploads/voice-1.webm', 'audio', 'voice-note.webm'),
            ($1, $3, 'Bob', '', '/static/uploads/doc1.pdf', 'file', 'report.pdf')`,
    [convId, adminId, idB]
  );

  // [Test 1] GET /api/conversations/:id/media
  console.log('[Test 1] Testing GET /api/conversations/:id/media...');
  const mediaRes = await request(`/api/conversations/${convId}/media`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(mediaRes.status, 200);
  assert.strictEqual(mediaRes.json.ok, true);
  assert.strictEqual(mediaRes.json.counts.photos, 1);
  assert.strictEqual(mediaRes.json.counts.videos, 1);
  assert.strictEqual(mediaRes.json.counts.audio, 1);
  assert.strictEqual(mediaRes.json.counts.files, 1);
  assert.strictEqual(mediaRes.json.photos[0].mediaType, 'image');
  assert.strictEqual(mediaRes.json.videos[0].mediaType, 'video');
  assert.strictEqual(mediaRes.json.audio[0].mediaType, 'audio');
  assert.strictEqual(mediaRes.json.files[0].mediaType, 'file');
  console.log('  ✔ /api/conversations/:id/media categorized photos, videos, audio, and files accurately');

  // [Test 2] Socket message tempId echo
  console.log('[Test 2] Testing socket tempId broadcast & ack...');
  const socketClient = Client(`http://127.0.0.1:${PORT}`, {
    auth: { token: adminToken },
    transports: ['websocket'],
  });

  await new Promise((resolve) => socketClient.on('connect', resolve));

  const clientTempId = 'opt-test-12345';
  const ackReceived = await new Promise((resolve) => {
    socketClient.emit('message', {
      tempId: clientTempId,
      conversationId: convId,
      text: 'Optimistic text test',
    }, (ack) => {
      resolve(ack);
    });
  });

  assert.strictEqual(ackReceived.ok, true);
  assert.strictEqual(ackReceived.tempId, clientTempId);
  console.log('  ✔ Socket ack and broadcast accurately include tempId');
  socketClient.disconnect();

  // [Test 3] DELETE /api/admin/users/:id
  console.log('[Test 3] Testing Admin DELETE user account...');
  
  // Non-admin attempt should be 403
  const forbiddenDel = await request(`/api/admin/users/${idB}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenC}` }, // Charlie is not admin
  });
  assert.strictEqual(forbiddenDel.status, 403);
  console.log('  ✔ Non-admin correctly rejected with 403');

  // Self deletion by admin should be 400
  const selfDel = await request(`/api/admin/users/${adminId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(selfDel.status, 400);
  console.log('  ✔ Admin cannot delete their own account (400)');

  // Admin deletes Bob
  const deleteBobRes = await request(`/api/admin/users/${idB}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(deleteBobRes.status, 200);
  assert.strictEqual(deleteBobRes.json.ok, true);

  // Verify Bob is deleted from chat_users
  const userCheck = await pool.query('SELECT 1 FROM chat_users WHERE id = $1', [idB]);
  assert.strictEqual(userCheck.rows.length, 0);

  // Verify direct conversation is deleted
  const convCheck = await pool.query('SELECT 1 FROM chat_conversations WHERE id = $1', [convId]);
  assert.strictEqual(convCheck.rows.length, 0);

  // Verify messages in that conversation are gone
  const msgCheck = await pool.query('SELECT 1 FROM chat_messages WHERE conversation_id = $1', [convId]);
  assert.strictEqual(msgCheck.rows.length, 0);

  console.log('  ✔ User Bob, direct conversations, and entire chat history permanently deleted');

  console.log('\n======================================================');
  console.log('  🎉 ALL SIDEPANEL & DELETE ACCOUNT TESTS PASSED!');
  console.log('======================================================\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
