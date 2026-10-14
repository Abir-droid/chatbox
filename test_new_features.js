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

  // [Test 7] Instant Real-Time Messaging to a User who has not opened the conversation room
  console.log('\n[Test 7] Real-Time Notification & Messaging to New Person (No refresh needed)...');
  const regFrank = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { name: 'Frank', phone: '01799999999', password: 'password123' },
  });
  const tokenFrank = regFrank.json.token;
  const userFrank = regFrank.json.user;

  const socketFrank = Client(`http://127.0.0.1:${PORT}`, {
    auth: { token: tokenFrank },
    transports: ['websocket'],
  });
  await new Promise((resolve) => socketFrank.on('connect', resolve));

  await request('/api/friends/add', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenDave}`, 'Content-Type': 'application/json' },
    body: { phone: userFrank.phone },
  });

  const directFrankRes = await request('/api/conversations/direct', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenDave}`, 'Content-Type': 'application/json' },
    body: { phone: userFrank.phone },
  });
  const convIdFrank = directFrankRes.json.conversation.id;

  const frankReceivedPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Frank did not receive live message via user room')), 4000);
    socketFrank.on('message', (msg) => {
      if (msg.conversationId === convIdFrank && msg.text === 'Hello Frank without refresh!') {
        clearTimeout(timer);
        resolve(msg);
      }
    });
  });

  await new Promise((resolve) => {
    socketDave.emit(
      'message',
      {
        conversationId: convIdFrank,
        text: 'Hello Frank without refresh!',
      },
      (ack) => {
        assert.equal(ack.ok, true);
        resolve();
      }
    );
  });

  const frankMsg = await frankReceivedPromise;
  assert.equal(frankMsg.text, 'Hello Frank without refresh!');
  console.log('  ✔ Frank received live message in real time without refreshing or opening the chat!');

  // 8. Bangladesh Phone Number Matching (+880 vs 01...)
  console.log('\n[Test 8] Bangladesh Phone Number Normalization (+880 vs 01...)...');
  const regKamal = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { name: 'Kamal Hossain', phone: '+8801712345678', password: 'password123' },
  });
  assert.equal(regKamal.status, 200);
  const tokenKamal = regKamal.json.token;
  const userKamal = regKamal.json.user;

  const regRahim = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { name: 'Rahim Uddin', phone: '01812345678', password: 'password123' },
  });
  assert.equal(regRahim.status, 200);
  const tokenRahim = regRahim.json.token;
  const userRahim = regRahim.json.user;

  // Duplicate registration rejection with alternate BD format
  const dupReg = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { name: 'Duplicate Kamal', phone: '01712345678', password: 'password123' },
  });
  assert.equal(dupReg.status, 400);
  console.log('  ✔ Duplicate registration prevented across BD phone formats (+880 vs 01)');

  // Self friend request blocked even when using alternate format
  const selfReq = await request('/api/friends/request', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenKamal}`, 'Content-Type': 'application/json' },
    body: { phone: '01712345678' },
  });
  assert.equal(selfReq.status, 400);
  console.log('  ✔ Self friend request blocked across alternate phone formats');

  // Rahim sends friend request to Kamal using Kamal's regular local number 01712345678
  const reqToKamal = await request('/api/friends/request', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenRahim}`, 'Content-Type': 'application/json' },
    body: { phone: '01712345678' },
  });
  assert.equal(reqToKamal.status, 200);
  assert.equal(reqToKamal.json.ok, true);
  console.log('  ✔ Rahim sent friend request to Kamal using regular number 01712345678 (registered +8801712345678)');

  // Kamal lists friend requests and sees Rahim
  const kamalRequests = await request('/api/friends/requests', {
    headers: { Authorization: `Bearer ${tokenKamal}` },
  });
  assert.equal(kamalRequests.status, 200);
  assert.equal(kamalRequests.json.requests.length, 1);
  const reqIdKamal = kamalRequests.json.requests[0].id;

  // Kamal accepts friend request
  const acceptRes = await request(`/api/friends/requests/${reqIdKamal}/accept`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenKamal}` },
  });
  assert.equal(acceptRes.status, 200);
  console.log('  ✔ Kamal accepted friend request; both are now mutual friends');

  // Kamal opens direct chat with Rahim using +8801812345678 (Rahim registered with 01812345678)
  const directKamalRahim = await request('/api/conversations/direct', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenKamal}`, 'Content-Type': 'application/json' },
    body: { phone: '+8801812345678' },
  });
  assert.equal(directKamalRahim.status, 200);
  const convIdKR = directKamalRahim.json.conversation.id;
  console.log('  ✔ Direct chat created using international format (+8801812345678) for local user (01812345678)');

  // Cross-format Login verification
  const loginKamalLocal = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { phone: '01712345678', password: 'password123' },
  });
  assert.equal(loginKamalLocal.status, 200);
  assert.equal(loginKamalLocal.json.user.id, userKamal.id);

  const loginRahimIntl = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: { phone: '+8801812345678', password: 'password123' },
  });
  assert.equal(loginRahimIntl.status, 200);
  assert.equal(loginRahimIntl.json.user.id, userRahim.id);
  console.log('  ✔ Seamless login verified using both +880 and 01 formats');

  // 9. Admin Permanent Deletion (Purge) of Deleted Messages
  console.log('\n[Test 9] Admin Permanent Deletion (Purge) of Soft-Deleted Messages...');

  // Connect socket for Kamal to send a message
  const socketKamal = Client(`http://127.0.0.1:${PORT}`, {
    path: '/socket.io',
    auth: { token: tokenKamal },
  });
  await new Promise((resolve) => socketKamal.on('connect', resolve));

  let msgIdToPurge;
  await new Promise((resolve) => {
    socketKamal.emit(
      'message',
      { conversationId: convIdKR, text: 'Sensitive message to be permanently purged' },
      (ack) => {
        assert.equal(ack.ok, true);
        msgIdToPurge = ack.id;
        resolve();
      }
    );
  });

  // Kamal soft deletes the message
  const softDelRes = await request(`/api/messages/${msgIdToPurge}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenKamal}` },
  });
  assert.equal(softDelRes.status, 200);

  // Soft-deleted message is hidden from regular chat history
  const normalHistory = await request(`/api/conversations/${convIdKR}/messages`, {
    headers: { Authorization: `Bearer ${tokenKamal}` },
  });
  assert.equal(normalHistory.status, 200);
  assert.equal(normalHistory.json.messages.length, 0);

  // Admin (Dave) audit log preserves and sees the deleted message
  const auditBefore = await request(`/api/admin/conversations/${convIdKR}/audit`, {
    headers: { Authorization: `Bearer ${tokenDave}` },
  });
  assert.equal(auditBefore.status, 200);
  assert.equal(auditBefore.json.messages.length, 1);
  assert.equal(auditBefore.json.messages[0].isDeleted, true);
  console.log('  ✔ Soft-deleted message hidden from users but visible to Admin in audit log');

  // Non-admin (Rahim) attempts to permanently purge message -> 403 Forbidden
  const forbiddenPurge = await request(`/api/admin/messages/${msgIdToPurge}/purge`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenRahim}` },
  });
  assert.equal(forbiddenPurge.status, 403);
  console.log('  ✔ Non-admin users cannot permanently purge messages (403 Forbidden)');

  // Admin (Dave) permanently purges the message from database
  const purgeRes = await request(`/api/admin/messages/${msgIdToPurge}/purge`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenDave}` },
  });
  assert.equal(purgeRes.status, 200);
  assert.equal(purgeRes.json.ok, true);

  // Verify message is completely gone from the database audit log as well
  const auditAfter = await request(`/api/admin/conversations/${convIdKR}/audit`, {
    headers: { Authorization: `Bearer ${tokenDave}` },
  });
  assert.equal(auditAfter.status, 200);
  assert.equal(auditAfter.json.messages.length, 0);
  console.log('  ✔ Admin permanently purged message: completely deleted from database and audit log');

  // Test bulk purge of all deleted messages in conversation
  await new Promise((resolve) => {
    socketKamal.emit('message', { conversationId: convIdKR, text: 'Deleted 1' }, () => resolve());
  });
  await new Promise((resolve) => {
    socketKamal.emit('message', { conversationId: convIdKR, text: 'Deleted 2' }, () => resolve());
  });
  const msgsRes = await request(`/api/conversations/${convIdKR}/messages`, {
    headers: { Authorization: `Bearer ${tokenKamal}` },
  });
  for (const m of msgsRes.json.messages) {
    await request(`/api/messages/${m.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tokenKamal}` } });
  }

  const bulkPurgeRes = await request(`/api/admin/conversations/${convIdKR}/purge-deleted`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenDave}` },
  });
  assert.equal(bulkPurgeRes.status, 200);
  assert.equal(bulkPurgeRes.json.purgedCount, 2);
  console.log('  ✔ Admin bulk purged all soft-deleted messages in conversation');

  // 10. Admin Role Promotion & Claim Admin
  console.log('\n[Test 10] Admin Role Management & Claim Admin...');
  const promoteRes = await request(`/api/admin/users/${userKamal.id}/role`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenDave}`, 'Content-Type': 'application/json' },
    body: { isAdmin: true },
  });
  assert.equal(promoteRes.status, 200);
  assert.equal(promoteRes.json.isAdmin, true);

  const meKamal = await request('/api/auth/me', {
    headers: { Authorization: `Bearer ${tokenKamal}` },
  });
  assert.equal(meKamal.json.user.is_admin, true);
  console.log('  ✔ Admin promoted Kamal to Administrator successfully');

  // Claim admin via code for Rahim
  const claimRes = await request('/api/auth/claim-admin', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenRahim}`, 'Content-Type': 'application/json' },
    body: { code: 'admin123' },
  });
  assert.equal(claimRes.status, 200);
  assert.equal(claimRes.json.ok, true);

  const meRahim = await request('/api/auth/me', {
    headers: { Authorization: `Bearer ${tokenRahim}` },
  });
  assert.equal(meRahim.json.user.is_admin, true);
  console.log('  ✔ Rahim claimed admin privileges via admin code');

  socketKamal.disconnect();
  socketFrank.disconnect();
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
