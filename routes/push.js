// routes/push.js - Device token registration for Firebase Cloud Messaging
const pushService = require('../push');

module.exports = function registerPushRoutes({ app, pool, authMiddleware, PREFIX, cleanupCall, activeCalls, io }) {
  const pfx = (path) => (PREFIX ? [`${PREFIX}${path}`, path] : [path]);

  // Decline call via native notification button
  app.post(pfx('/api/push/call-decline'), async (req, res) => {
    try {
      const { callId } = req.body || {};
      if (callId && typeof cleanupCall === 'function') {
        const call = activeCalls && activeCalls.get(callId);
        if (call) {
          cleanupCall(callId, 'declined');
          if (io) {
            io.to(`u:${call.callerId}`).emit('call_rejected', { callId, reason: 'declined' });
          }
        }
      }
      return res.json({ ok: true });
    } catch {
      return res.json({ ok: true });
    }
  });

  // Register device FCM push token
  app.post(pfx('/api/push/register'), authMiddleware, async (req, res) => {
    try {
      const { token, platform } = req.body || {};
      if (!token || typeof token !== 'string' || !token.trim()) {
        return res.status(400).json({ ok: false, error: 'Token is required' });
      }

      await pushService.registerToken(pool, req.user.id, token.trim(), platform || 'android');
      return res.json({ ok: true });
    } catch (err) {
      console.error('[FCM] Error in /api/push/register:', err);
      return res.status(500).json({ ok: false, error: 'Internal server error' });
    }
  });

  // Unregister device FCM push token (e.g. on logout)
  app.post(pfx('/api/push/unregister'), authMiddleware, async (req, res) => {
    try {
      const { token } = req.body || {};
      if (token) {
        await pushService.unregisterToken(pool, req.user.id, token.trim());
      }
      return res.json({ ok: true });
    } catch (err) {
      console.error('[FCM] Error in /api/push/unregister:', err);
      return res.status(500).json({ ok: false, error: 'Internal server error' });
    }
  });
};
