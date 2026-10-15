'use strict';

const assert = require('node:assert/strict');
const http = require('node:http');
const { io: Client } = require('socket.io-client');

process.env.PORT = '3099';
process.env.HOST = '127.0.0.1';
delete process.env.DATABASE_URL;

const {
  server,
  app,
  io,
  getPool,
  initDatabase,
  stripPrefix,
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

async function runTests() {
  console.log('--- Starting Enhanced Chatbox Test Suite ---\n');

  console.log('[1/8] Initializing Database & Server...');
  await initDatabase();
  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`Server listening on port ${PORT}`);

  let tokenAlice = '';
  let tokenBob = '';
  let tokenCharlie = '';
  let userAlice = null;
  let userBob = null;
  let userCharlie = null;

  // Test 1: User Registration
  console.log('\n[2/8] Testing User Registration with Phone Number & Password...');
  {
    // First user registered becomes Admin
    const regAlice = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { name: 'Alice Admin', phone: '+1234567890', password: 'password123' },
    });
    assert.equal(regAlice.status, 200);
    assert.equal(regAlice.json.ok, true);
    assert.equal(regAlice.json.user.phone, '+1234567890');
    assert.equal(regAlice.json.user.is_admin, true, 'First user should be admin');
    tokenAlice = regAlice.json.token;
    userAlice = regAlice.json.user;
    console.log('  ✔ Alice registered (Admin)');

    // Second user Bob
    const regBob = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { name: 'Bob User', phone: '+1987654321', password: 'password123' },
    });
    assert.equal(regBob.status, 200);
    assert.equal(regBob.json.user.is_admin, false);
    tokenBob = regBob.json.token;
    userBob = regBob.json.user;
    console.log('  ✔ Bob registered (Regular User)');

    // Third user Charlie
    const regCharlie = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { name: 'Charlie', phone: '+1555555555', password: 'password123' },
    });
    tokenCharlie = regCharlie.json.token;
    userCharlie = regCharlie.json.user;
    console.log('  ✔ Charlie registered');

    // Duplicate phone check
    const regDup = await request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { name: 'Fake Alice', phone: '+1234567890', password: 'password123' },
    });
    assert.equal(regDup.status, 400, 'Duplicate phone should be rejected');
    console.log('  ✔ Duplicate phone registration rejected');
  }

  // Test 2: Login with Phone
  console.log('\n[3/8] Testing Authentication & Token Login...');
  {
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { phone: '+1987654321', password: 'password123' },
    });
    assert.equal(loginRes.status, 200);
    assert.ok(loginRes.json.token);
    assert.equal(loginRes.json.user.name, 'Bob User');
    console.log('  ✔ Bob successfully logged in with phone and password');

    const meRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${tokenBob}` },
    });
    assert.equal(meRes.status, 200);
    assert.equal(meRes.json.user.phone, '+1987654321');
    console.log('  ✔ /api/auth/me verified with Bearer token');
  }

  // Test 3: Friends List
  console.log('\n[4/8] Testing Friend List Management...');
  {
    const addFriendRes = await request('/api/friends/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAlice}`,
      },
      body: { phone: '+1987654321' },
    });
    assert.equal(addFriendRes.status, 200);
    assert.equal(addFriendRes.json.friend.name, 'Bob User');

    const friendsRes = await request('/api/friends', {
      headers: { Authorization: `Bearer ${tokenAlice}` },
    });
    assert.equal(friendsRes.status, 200);
    assert.equal(friendsRes.json.friends.length, 1);
    assert.equal(friendsRes.json.friends[0].phone, '+1987654321');
    console.log('  ✔ Alice added Bob to friends list by phone');
  }

  // Test 4: 1-on-1 Direct Messaging & Group Chat
  let directConvId = null;
  let groupConvId = null;
  console.log('\n[5/8] Testing Direct Chats & Group Creation...');
  {
    // Start direct chat between Alice and Bob
    const dmRes = await request('/api/conversations/direct', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAlice}`,
      },
      body: { phone: '+1987654321' },
    });
    assert.equal(dmRes.status, 200);
    directConvId = dmRes.json.conversation.id;
    console.log(`  ✔ Direct conversation created between Alice & Bob (ID: ${directConvId})`);

    // Create Group chat
    const grpRes = await request('/api/conversations/group', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAlice}`,
      },
      body: {
        name: 'Coolify Engineers',
        phones: ['+1987654321'], // Alice and Bob
      },
    });
    assert.equal(grpRes.status, 200);
    groupConvId = grpRes.json.conversation.id;
    console.log(`  ✔ Group "Coolify Engineers" created (ID: ${groupConvId})`);

    // Add Charlie to the group by phone
    const addMemberRes = await request(`/api/conversations/${groupConvId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAlice}`,
      },
      body: { phone: '+1555555555' },
    });
    assert.equal(addMemberRes.status, 200);
    assert.equal(addMemberRes.json.addedUser.name, 'Charlie');
    console.log('  ✔ Charlie added to group by phone number');

    const membersRes = await request(`/api/conversations/${groupConvId}/members`, {
      headers: { Authorization: `Bearer ${tokenAlice}` },
    });
    assert.equal(membersRes.status, 200);
    assert.equal(membersRes.json.members.length, 3, 'Group now has 3 members');
    console.log('  ✔ Group members list verified');
  }

  // Test 5: Real-time Socket.IO Messaging & Media
  console.log('\n[6/8] Testing Real-Time Socket.IO Messaging & Multi-Client Broadcast...');
  const clientUrl = `http://127.0.0.1:${PORT}`;
  const socketAlice = Client(clientUrl, {
    path: '/socket.io',
    auth: { token: tokenAlice },
  });
  const socketBob = Client(clientUrl, {
    path: '/socket.io',
    auth: { token: tokenBob },
  });

  await new Promise((resolve) => socketAlice.on('connect', resolve));
  await new Promise((resolve) => socketBob.on('connect', resolve));
  console.log('  ✔ Both client sockets connected with auth tokens');

  let sentMessageId = null;
  // Alice sends a message in Direct Chat, Bob receives
  const bobMsgPromise = new Promise((resolve) => {
    socketBob.on('message', (msg) => {
      if (msg.conversationId === directConvId && msg.text === 'Hey Bob, check this out!') {
        resolve(msg);
      }
    });
  });

  const sendAck = await new Promise((resolve) => {
    socketAlice.emit(
      'message',
      {
        conversationId: directConvId,
        text: 'Hey Bob, check this out!',
        mediaUrl: '/static/uploads/sample.png',
        mediaType: 'image',
        mediaName: 'sample.png',
      },
      resolve
    );
  });
  assert.equal(sendAck.ok, true);
  sentMessageId = sendAck.id;

  const receivedMsg = await bobMsgPromise;
  assert.equal(receivedMsg.senderName, 'Alice Admin');
  assert.equal(receivedMsg.mediaUrl, '/static/uploads/sample.png');
  console.log('  ✔ Direct message with photo attachment received in real time by Bob');

  // Test 6: Telegram-style Hard Deletion (Leaves No Trace Behind)
  console.log('\n[7/8] Testing Telegram-Style Message Deletion (Leaves No Trace Behind)...');
  {
    // Alice deletes the message
    const delRes = await request(`/api/messages/${sentMessageId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenAlice}` },
    });
    assert.equal(delRes.status, 200);
    assert.equal(delRes.json.ok, true);
    console.log('  ✔ Message hard-deleted by user');

    // Regular conversation history now EXCLUDES the deleted message
    const msgsRes = await request(`/api/conversations/${directConvId}/messages`, {
      headers: { Authorization: `Bearer ${tokenAlice}` },
    });
    const foundInRegular = msgsRes.json.messages.some((m) => m.id === sentMessageId);
    assert.equal(foundInRegular, false, 'Deleted message should not be visible to user');
    console.log('  ✔ Deleted message completely removed from conversation history');

    // Admin audit endpoint is removed (returns 404)
    const auditRes = await request(`/api/admin/conversations/${directConvId}/audit`, {
      headers: { Authorization: `Bearer ${tokenAlice}` },
    });
    assert.equal(auditRes.status, 404, 'Admin audit endpoint should no longer exist');
    console.log('  ✔ Admin audit log removed as requested');
  }

  // Test 7: Admin Moderation & User Suspension
  console.log('\n[8/8] Testing Admin Moderation (Block/Suspend User)...');
  {
    // Alice checks stats
    const statsRes = await request('/api/admin/stats', {
      headers: { Authorization: `Bearer ${tokenAlice}` },
    });
    assert.equal(statsRes.status, 200);
    assert.equal(statsRes.json.stats.totalUsers, 3);
    assert.ok(statsRes.json.stats.totalMessages >= 1);
    console.log('  ✔ Admin stats verified (3 users, active messages)');

    // Alice suspends Bob
    const suspendRes = await request(`/api/admin/users/${userBob.id}/suspend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAlice}`,
      },
      body: { suspend: true },
    });
    assert.equal(suspendRes.status, 200);
    assert.equal(suspendRes.json.suspended, true);
    console.log('  ✔ Admin blocked/suspended Bob');

    // Bob tries to log in while suspended -> 403 Forbidden
    const bobLoginBlocked = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { phone: '+1987654321', password: 'password123' },
    });
    assert.equal(bobLoginBlocked.status, 403, 'Suspended user login should be forbidden');
    console.log('  ✔ Suspended user is prevented from logging in');
  }

  // Cleanup
  socketAlice.disconnect();
  socketBob.disconnect();
  await new Promise((resolve) => io.close(resolve));
  await new Promise((resolve) => server.close(resolve));
  await getPool().end();

  console.log('\n======================================================');
  console.log('  🎉 ALL ENHANCED CHATBOX TESTS PASSED SUCCESSFULLY!  ');
  console.log('======================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed with error:', err);
  process.exit(1);
});
