// routes/push.js - Device token registration for Firebase Cloud Messaging
const pushService = require('../push');

module.exports = function registerPushRoutes({ app, pool, authMiddleware, PREFIX }) {
  const pfx = (path) => (PREFIX ? [`${PREFIX}${path}`, path] : [path]);

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
