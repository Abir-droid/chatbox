'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

test('conversation hash and storage ID parsing logic', () => {
  function getSavedConversationId(hash, localStorageValue) {
    const match = (hash || '').match(/#(?:c=|conv=)?(\d+)/);
    if (match) {
      const id = Number(match[1]);
      if (Number.isFinite(id) && id > 0) return id;
    }
    if (localStorageValue) {
      const id = Number(localStorageValue);
      if (Number.isFinite(id) && id > 0) return id;
    }
    return null;
  }

  assert.equal(getSavedConversationId('#c=42', null), 42);
  assert.equal(getSavedConversationId('#conv=99', null), 99);
  assert.equal(getSavedConversationId('#105', null), 105);
  assert.equal(getSavedConversationId('', '55'), 55);
  assert.equal(getSavedConversationId('', null), null);
  assert.equal(getSavedConversationId('#invalid', '77'), 77);
  assert.equal(getSavedConversationId('#invalid', null), null);
});

test('call session persistence data serialization and restoration', () => {
  const callState = {
    active: true,
    callId: 'call_123_abc',
    peerId: 2,
    peerName: 'Alice',
    peerAvatarUrl: null,
    peerAvatarColor: 3,
    callType: 'video',
    isInitiator: true,
    startTime: 1700000000000,
    isMuted: true,
    isCameraOff: false,
    isMinimized: true,
  };

  const serialized = JSON.stringify({
    callId: callState.callId,
    peerId: callState.peerId,
    peerName: callState.peerName,
    peerAvatarUrl: callState.peerAvatarUrl,
    peerAvatarColor: callState.peerAvatarColor,
    callType: callState.callType,
    isInitiator: callState.isInitiator,
    startTime: callState.startTime,
    conversationId: 10,
    isMuted: Boolean(callState.isMuted),
    isCameraOff: Boolean(callState.isCameraOff),
    isMinimized: Boolean(callState.isMinimized),
  });

  const parsed = JSON.parse(serialized);
  assert.equal(parsed.callId, 'call_123_abc');
  assert.equal(parsed.peerName, 'Alice');
  assert.equal(parsed.callType, 'video');
  assert.equal(parsed.startTime, 1700000000000);
  assert.equal(parsed.isMuted, true);
  assert.equal(parsed.isMinimized, true);
});

test('server call grace period and call_rejoin state transition', () => {
  const activeCalls = new Map();
  const userActiveCalls = new Map();

  const callId = 'call_test_1';
  const callRecord = {
    id: callId,
    callerId: 1,
    calleeId: 2,
    conversationId: 5,
    callType: 'audio',
    status: 'active',
    createdAt: Date.now() - 5000,
    acceptedAt: Date.now() - 4000,
    timeoutTimer: null,
    reconnectTimer: null,
    reconnectingUser: null,
  };

  activeCalls.set(callId, callRecord);
  userActiveCalls.set(1, callId);
  userActiveCalls.set(2, callId);

  // User 1 disconnects (e.g. page refresh)
  let peerReconnectingEmitted = false;
  let endedEmitted = false;

  function onUserDisconnect(userId) {
    if (userActiveCalls.has(userId)) {
      const cId = userActiveCalls.get(userId);
      const call = activeCalls.get(cId);
      if (call && call.status === 'active') {
        call.reconnectingUser = userId;
        peerReconnectingEmitted = true;
        call.reconnectTimer = setTimeout(() => {
          if (activeCalls.has(cId) && activeCalls.get(cId).reconnectingUser === userId) {
            activeCalls.delete(cId);
            userActiveCalls.delete(call.callerId);
            userActiveCalls.delete(call.calleeId);
            endedEmitted = true;
          }
        }, 50);
      }
    }
  }

  function onUserRejoin(userId, cId) {
    const call = activeCalls.get(cId);
    if (!call || call.status !== 'active') return { ok: false, error: 'Call no longer active' };
    if (call.callerId !== userId && call.calleeId !== userId) return { ok: false, error: 'Unauthorized' };

    if (call.reconnectTimer) {
      clearTimeout(call.reconnectTimer);
      call.reconnectTimer = null;
    }
    call.reconnectingUser = null;
    userActiveCalls.set(userId, cId);
    return { ok: true, call };
  }

  // Trigger disconnect
  onUserDisconnect(1);
  assert.equal(peerReconnectingEmitted, true);
  assert.equal(activeCalls.has(callId), true);
  assert.equal(callRecord.reconnectingUser, 1);

  // User 1 reconnects within grace period
  const rejoinRes = onUserRejoin(1, callId);
  assert.equal(rejoinRes.ok, true);
  assert.equal(callRecord.reconnectTimer, null);
  assert.equal(callRecord.reconnectingUser, null);
  assert.equal(activeCalls.has(callId), true);
  assert.equal(endedEmitted, false);
});
