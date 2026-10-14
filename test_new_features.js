'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { io: Client } = require('socket.io-client');

process.env.PORT = '3098';
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
  console.log('--- Running New Features Verification Test ---\n');
  await initDatabase();
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

  // 1. Register User 1 (Dave) and User 2 (Emma)
  console.log('[Test 1] User Registration & Profile Edit...');
  const regDave = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { name: 'Dave Miller', phone: '+1111111111', password: 'password123' },
  });
  assert.equal(regDave.status, 200);
  const tokenDave = regDave.json.token;
  const userDave = regDave.json.user;

  const regEmma = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { name: 'Emma Watson', phone: '+2222222222', password: 'password123' },
  });
  assert.equal(regEmma.status, 200);
  const tokenEmma = regEmma.json.token;
  const userEmma = regEmma.json.user;

  // Profile Edit for Dave
  const editDave = await request('/api/profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenDave}`,
    },
    body: {
      name: 'Dave M. (Updated)',
      avatarColor: 7,
      avatarUrl: '/static/uploads/avatar-dave.png',
    },
  });
  assert.equal(editDave.status, 200);
  assert.equal(editDave.json.user.name, 'Dave M. (Updated)');
  assert.equal(editDave.json.user.avatar_color, 7);
  assert.equal(editDave.json.user.avatar_url, '/static/uploads/avatar-dave.png');
  console.log('  ✔ Dave edited profile successfully (name, avatar color, avatar url)');

  // 2. Non-friends cannot talk in direct chat
  console.log('\n[Test 2] Direct Chat Prevention Between Non-Friends...');
  const directFail = await request('/api/conversations/direct', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenDave}`,
    },
    body: { phone: userEmma.phone },
  });
  assert.equal(directFail.status, 403);
  assert.equal(directFail.json.requiresFriendRequest, true);
  console.log('  ✔ Direct chat blocked between non-friends (403 requiresFriendRequest)');

  // 3. Friend Request Flow (Send, List, Accept)
  console.log('\n[Test 3] Friend Request Flow...');
  const sendReq = await request('/api/friends/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenDave}`,
    },
    body: { phone: userEmma.phone },
  });
  assert.equal(sendReq.status, 200);
  assert.equal(sendReq.json.ok, true);
  console.log('  ✔ Dave sent friend request to Emma');

  const listReqs = await request('/api/friends/requests', {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenEmma}` },
  });
  assert.equal(listReqs.status, 200);
  assert.equal(listReqs.json.requests.length, 1);
  assert.equal(listReqs.json.requests[0].senderId, userDave.id);
  const reqId = listReqs.json.requests[0].id;
  console.log('  ✔ Emma received pending friend request from Dave');

  const acceptReq = await request(`/api/friends/requests/${reqId}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenEmma}` },
  });
  assert.equal(acceptReq.status, 200);
  assert.equal(acceptReq.json.ok, true);
  console.log('  ✔ Emma accepted friend request');

  // Verify they are now friends
  const emmaFriends = await request('/api/friends', {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenEmma}` },
  });
  assert.equal(emmaFriends.json.friends.length, 1);
  assert.equal(emmaFriends.json.friends[0].id, userDave.id);
  assert.equal(emmaFriends.json.friends[0].avatarUrl, '/static/uploads/avatar-dave.png');
  console.log('  ✔ Emma and Dave are now mutual friends (with Dave avatarUrl)');

  // 4. Now Direct Chat is Allowed
  console.log('\n[Test 4] Direct Chat Creation After Friendship...');
  const directSuccess = await request('/api/conversations/direct', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenDave}`,
    },
    body: { phone: userEmma.phone },
  });
  assert.equal(directSuccess.status, 200);
  const convId = directSuccess.json.conversation.id;
  console.log(`  ✔ Direct conversation created successfully (ID: ${convId})`);

  // 5. Real-Time Messages & Conversation Delete for Me
  console.log('\n[Test 5] "Delete for Me" Conversation Logic...');

  // Connect sockets
  const socketDave = Client(`http://127.0.0.1:${PORT}`, {
    auth: { token: tokenDave },
    transports: ['websocket'],
  });
  const socketEmma = Client(`http://127.0.0.1:${PORT}`, {
    auth: { token: tokenEmma },
    transports: ['websocket'],
  });

  await new Promise((res) => socketDave.on('connect', res));
  await new Promise((res) => socketEmma.on('connect', res));

  // Dave sends message 1 to Emma
  await new Promise((resolve) => {
    socketDave.emit(
      'message',
      { conversationId: convId, text: 'Hello Emma! Secret message 1' },
      (ack) => {
        assert.equal(ack.ok, true);
        resolve();
      }
    );
  });

  // Verify both Dave and Emma see message 1
  const msgsDave1 = await request(`/api/conversations/${convId}/messages`, {
    headers: { Authorization: `Bearer ${tokenDave}` },
  });
  assert.equal(msgsDave1.json.messages.length, 1);

  const msgsEmma1 = await request(`/api/conversations/${convId}/messages`, {
    headers: { Authorization: `Bearer ${tokenEmma}` },
  });
  assert.equal(msgsEmma1.json.messages.length, 1);
  console.log('  ✔ Message 1 sent and visible to both participants');

  // Dave deletes the conversation for himself ("Delete for me")
  const delConv = await request(`/api/conversations/${convId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenDave}` },
  });
  assert.equal(delConv.status, 200);
  console.log('  ✔ Dave deleted conversation for himself');

  // For Dave: conversation list should NOT include convId, and messages should be empty
  const daveConvs = await request('/api/conversations', {
    headers: { Authorization: `Bearer ${tokenDave}` },
  });
  const daveHasConv = daveConvs.json.conversations.some((c) => c.id === convId);
  assert.equal(daveHasConv, false, 'Conversation should be hidden from Dave');

  const daveMsgsAfterDel = await request(`/api/conversations/${convId}/messages`, {
    headers: { Authorization: `Bearer ${tokenDave}` },
  });
  assert.equal(daveMsgsAfterDel.json.messages.length, 0, 'Dave should see 0 messages');
  console.log('  ✔ Conversation and previous messages are hidden from Dave');

  // For Emma: conversation and history MUST be 100% intact!
  const emmaConvs = await request('/api/conversations', {
    headers: { Authorization: `Bearer ${tokenEmma}` },
  });
  const emmaHasConv = emmaConvs.json.conversations.some((c) => c.id === convId);
  assert.equal(emmaHasConv, true, 'Emma must still see the conversation');

  const emmaMsgsAfterDel = await request(`/api/conversations/${convId}/messages`, {
    headers: { Authorization: `Bearer ${tokenEmma}` },
  });
  assert.equal(emmaMsgsAfterDel.json.messages.length, 1, 'Emma must still see message 1');
  assert.equal(emmaMsgsAfterDel.json.messages[0].text, 'Hello Emma! Secret message 1');
  console.log('  ✔ Emma still has the full conversation and message 1 completely intact!');

  // Emma sends a new message 2 to Dave
  await new Promise((resolve) => {
    socketEmma.emit(
      'message',
      { conversationId: convId, text: 'Hey Dave! Are you still there?' },
      (ack) => {
        assert.equal(ack.ok, true);
        resolve();
      }
    );
  });

  // Now conversation reappears for Dave with ONLY message 2 (not message 1)
  const daveConvsNew = await request('/api/conversations', {
    headers: { Authorization: `Bearer ${tokenDave}` },
  });
  const daveHasConvNew = daveConvsNew.json.conversations.some((c) => c.id === convId);
  assert.equal(daveHasConvNew, true, 'Conversation reappears for Dave after new message arrives');

  const daveMsgsNew = await request(`/api/conversations/${convId}/messages`, {
    headers: { Authorization: `Bearer ${tokenDave}` },
  });
  assert.equal(daveMsgsNew.json.messages.length, 1, 'Dave only sees the new message');
  assert.equal(daveMsgsNew.json.messages[0].text, 'Hey Dave! Are you still there?');
  console.log('  ✔ Dave only sees the newly arrived message, pre-delete message remains hidden');

  // Emma sees BOTH messages 1 and 2
  const emmaMsgsFinal = await request(`/api/conversations/${convId}/messages`, {
    headers: { Authorization: `Bearer ${tokenEmma}` },
  });
  assert.equal(emmaMsgsFinal.json.messages.length, 2);
  console.log('  ✔ Emma sees all 2 messages in full history');

  // [Test 6] Favicon & Voice Note Messaging Verification
  console.log('\n[Test 6] Favicon & Voice Note Messaging Verification...');
  const favRes = await request('/favicon.ico');
  assert.equal(favRes.status, 200);
  assert.match(favRes.headers['content-type'], /image\/svg\+xml/);
  console.log('  ✔ /favicon.ico successfully served with SVG icon');

  await new Promise((resolve) => {
    socketDave.emit(
      'message',
      {
        conversationId: convId,
        text: '',
        mediaUrl: '/static/uploads/voice-test.webm',
        mediaType: 'audio',
        mediaName: 'Voice note',
      },
      (ack) => {
        assert.equal(ack.ok, true);
        resolve();
      }
    );
  });

  const emmaMsgsVoice = await request(`/api/conversations/${convId}/messages`, {
    headers: { Authorization: `Bearer ${tokenEmma}` },
  });
  const voiceMsg = emmaMsgsVoice.json.messages.find((m) => m.mediaType === 'audio');
  assert.ok(voiceMsg, 'Voice note message is present in conversation history');
  assert.equal(voiceMsg.mediaType, 'audio');
  assert.equal(voiceMsg.mediaName, 'Voice note');
  console.log('  ✔ Voice note audio message exchanged and verified in history');

  socketDave.disconnect();
  socketEmma.disconnect();
  server.close();

  console.log('\n======================================================');
  console.log('  🎉 ALL NEW FEATURES PASSED VERIFICATION SUITE!');
  console.log('======================================================\n');
  process.exit(0);
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
