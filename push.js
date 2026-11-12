// push.js - Firebase Cloud Messaging (FCM) push notifications and device token management
const fs = require('fs');
const path = require('path');

let firebaseApp = null;
let messaging = null;
let firebaseInitialized = false;

function initFirebase() {
  if (firebaseInitialized) return messaging;

  let initializeApp, cert, getApps, getMessaging;
  try {
    ({ initializeApp, cert, getApps } = require('firebase-admin/app'));
    ({ getMessaging } = require('firebase-admin/messaging'));
  } catch (err) {
    console.warn('[FCM] firebase-admin package is not installed; push notifications disabled.');
    return null;
  }

  try {
    let serviceAccount = null;

    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        console.error('[FCM] Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', e.message);
      }
    }

    if (!serviceAccount) {
      const explicitPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
      const defaultPath = path.join(__dirname, 'firebase-service-account.json');
      const targetPath = explicitPath || defaultPath;

      if (fs.existsSync(targetPath)) {
        const raw = fs.readFileSync(targetPath, 'utf8');
        serviceAccount = JSON.parse(raw);
      }
    }

    if (serviceAccount && serviceAccount.project_id) {
      const existing = getApps();
      if (existing && existing.length > 0) {
        firebaseApp = existing[0];
      } else {
        firebaseApp = initializeApp({
          credential: cert(serviceAccount)
        });
      }
      messaging = getMessaging(firebaseApp);
      firebaseInitialized = true;
      console.log(`[FCM] Firebase Admin initialized for project: ${serviceAccount.project_id}`);
      return messaging;
    } else {
      console.log('[FCM] No Firebase credentials found. Push notifications disabled until configured.');
    }
  } catch (err) {
    console.error('[FCM] Error initializing Firebase Admin:', err.message);
  }

  return null;
}

// Ensure database table exists
async function initPushSchema(pool) {
  if (!pool || typeof pool.query !== 'function') return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_device_tokens (
        id         BIGSERIAL PRIMARY KEY,
        user_id    BIGINT NOT NULL REFERENCES chat_users (id) ON DELETE CASCADE,
        token      TEXT NOT NULL UNIQUE,
        platform   TEXT NOT NULL DEFAULT 'android',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_chat_device_tokens_user ON chat_device_tokens (user_id);
    `);
  } catch (err) {
    console.warn('[FCM] Warning initializing chat_device_tokens schema:', err.message);
  }
}

// Register or update device token
async function registerToken(pool, userId, token, platform = 'android') {
  if (!pool || !userId || !token) return;
  try {
    await pool.query(
      `INSERT INTO chat_device_tokens (user_id, token, platform, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (token)
       DO UPDATE SET user_id = EXCLUDED.user_id, platform = EXCLUDED.platform, updated_at = now()`,
      [Number(userId), String(token).trim(), String(platform).toLowerCase()]
    );
  } catch (err) {
    console.error('[FCM] Failed to register device token:', err.message);
  }
}

// Unregister device token (e.g. on logout)
async function unregisterToken(pool, userId, token) {
  if (!pool || !userId || !token) return;
  try {
    await pool.query(
      'DELETE FROM chat_device_tokens WHERE user_id = $1 AND token = $2',
      [Number(userId), String(token).trim()]
    );
  } catch (err) {
    console.error('[FCM] Failed to unregister device token:', err.message);
  }
}

// Remove stale/invalid tokens
async function removeInvalidTokens(pool, badTokens) {
  if (!pool || !badTokens || !badTokens.length) return;
  try {
    await pool.query(
      'DELETE FROM chat_device_tokens WHERE token = ANY($1::text[])',
      [badTokens]
    );
  } catch (err) {
    console.warn('[FCM] Failed to prune invalid device tokens:', err.message);
  }
}

// Get device tokens for a set of user IDs
async function getTokensForUsers(pool, userIds) {
  if (!pool || !userIds || !userIds.length) return [];
  try {
    const res = await pool.query(
      'SELECT DISTINCT token FROM chat_device_tokens WHERE user_id = ANY($1::bigint[])',
      [userIds.map(Number)]
    );
    return res.rows.map(r => r.token);
  } catch (err) {
    console.error('[FCM] Failed to fetch device tokens:', err.message);
    return [];
  }
}

// Send incoming call alert
async function sendCallPush(pool, targetUserId, callData) {
  const msg = initFirebase();
  if (!msg) return;

  const tokens = await getTokensForUsers(pool, [targetUserId]);
  if (!tokens || !tokens.length) return;

  const callerName = callData.caller ? (callData.caller.name || callData.caller.phone || 'Someone') : 'Someone';
  const callType = callData.callType === 'video' ? 'Video' : 'Voice';

  const message = {
    tokens,
    data: {
      type: 'incoming_call',
      callId: String(callData.callId || ''),
      callerId: String((callData.caller && callData.caller.id) || ''),
      callerName: String(callerName),
      callerPhone: String((callData.caller && callData.caller.phone) || ''),
      callerAvatar: String((callData.caller && callData.caller.avatarUrl) || ''),
      conversationId: String(callData.conversationId || ''),
      callType: String(callData.callType || 'audio'),
      timestamp: String(Date.now())
    },
    android: {
      priority: 'high'
    }
  };

  try {
    const res = await msg.sendEachForMulticast(message);
    const badTokens = [];
    res.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const code = resp.error && resp.error.code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          badTokens.push(tokens[idx]);
        }
      }
    });
    if (badTokens.length > 0) {
      await removeInvalidTokens(pool, badTokens);
    }
  } catch (err) {
    console.error('[FCM] Error sending call push:', err.message);
  }
}

// Send call ended/missed dismiss signal
async function sendCallDismissPush(pool, targetUserId, callId, reason = 'ended') {
  const msg = initFirebase();
  if (!msg) return;

  const tokens = await getTokensForUsers(pool, [targetUserId]);
  if (!tokens || !tokens.length) return;

  const message = {
    tokens,
    data: {
      type: 'call_dismiss',
      callId: String(callId || ''),
      reason: String(reason)
    },
    android: {
      priority: 'high'
    }
  };

  try {
    await msg.sendEachForMulticast(message);
  } catch (err) {
    // Non-fatal
  }
}

// Send chat message push
async function sendMessagePush(pool, recipientUserIds, msgData) {
  const msg = initFirebase();
  if (!msg) return;

  const validIds = (recipientUserIds || []).map(Number).filter(id => id > 0);
  if (!validIds.length) return;

  const tokens = await getTokensForUsers(pool, validIds);
  if (!tokens || !tokens.length) return;

  const senderName = msgData.senderName || 'New Message';
  const title = msgData.isGroup && msgData.groupName
    ? `${msgData.groupName} (${senderName})`
    : senderName;

  let body = msgData.text || '';
  if (!body) {
    if (msgData.mediaType === 'image') body = '📷 Sent a photo';
    else if (msgData.mediaType === 'video') body = '🎥 Sent a video';
    else if (msgData.mediaType === 'audio') body = '🎤 Sent a voice message';
    else if (msgData.mediaType === 'call') body = '📞 Call log';
    else if (msgData.mediaType) body = '📎 Sent an attachment';
    else body = 'Sent a message';
  }

  const message = {
    tokens,
    notification: {
      title,
      body
    },
    data: {
      type: 'message',
      conversationId: String(msgData.conversationId || ''),
      senderId: String(msgData.senderId || ''),
      senderName: String(senderName)
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'chat_messages',
        sound: 'default',
        clickAction: 'FCM_PLUGIN_ACTIVITY'
      }
    }
  };

  try {
    const res = await msg.sendEachForMulticast(message);
    const badTokens = [];
    res.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const code = resp.error && resp.error.code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          badTokens.push(tokens[idx]);
        }
      }
    });
    if (badTokens.length > 0) {
      await removeInvalidTokens(pool, badTokens);
    }
  } catch (err) {
    console.error('[FCM] Error sending message push:', err.message);
  }
}

async function hasReachableDevice(pool, userId) {
  const tokens = await getTokensForUsers(pool, [userId]);
  return Boolean(tokens && tokens.length > 0);
}

module.exports = {
  initFirebase,
  initPushSchema,
  registerToken,
  unregisterToken,
  getTokensForUsers,
  hasReachableDevice,
  sendCallPush,
  sendCallDismissPush,
  sendMessagePush
};
