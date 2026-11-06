'use strict';

module.exports = function registerAuthRoutes(context) {
  const {
    app,
    pool,
    ADMIN_PHONE,
    io,
    authMiddleware,
    sanitizePhone,
    normalizePhoneForStorage,
    arePhonesMatching,
    findUserByPhone,
    hashPassword,
    verifyPassword,
    generateToken,
    getUserById
  } = context;

  // Auth: Register
  app.post('/api/auth/register', async (req, res) => {
    try {
      const name = String(req.body.name || '').trim();
      const phone = sanitizePhone(req.body.phone);
      const phoneToStore = normalizePhoneForStorage(phone);
      const password = String(req.body.password || '');

        if (name.length < 2 || name.length > 50) {
          return res.status(400).json({ ok: false, error: 'Name must be between 2 and 50 characters.' });
        }
        if (phoneToStore.startsWith('01')) {
          if (phoneToStore.length !== 11) {
            return res.status(400).json({ ok: false, error: 'Bangladesh mobile number must be 11 digits (e.g. 01712345678).' });
          }
        } else if (phone.length < 7 || phone.length > 16) {
          return res.status(400).json({ ok: false, error: 'Please enter a valid phone number (7-16 digits).' });
        }
        if (password.length < 6) {
          return res.status(400).json({ ok: false, error: 'Password must be at least 6 characters.' });
        }

        const existing = await findUserByPhone(phone);
        if (existing) {
          return res.status(400).json({ ok: false, error: 'An account with this phone number already exists.' });
        }

        // Determine admin status: first user or matches ADMIN_PHONE
        const userCountRes = await pool.query('SELECT count(*)::int as count FROM chat_users');
        const isFirstUser = userCountRes.rows[0].count === 0;
        const matchesAdminPhone = ADMIN_PHONE && arePhonesMatching(phone, ADMIN_PHONE);
        const isAdmin = Boolean(isFirstUser || matchesAdminPhone);

        const hash = hashPassword(password);
        const avatarColor = Math.floor(Math.random() * 10);

        const insertRes = await pool.query(
          `INSERT INTO chat_users (phone, name, password_hash, avatar_color, is_admin)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, phone, name, avatar_color, is_admin, created_at`,
          [phoneToStore, name, hash, avatarColor, isAdmin]
        );

        const user = insertRes.rows[0];
        user.id = Number(user.id);
        const token = generateToken(user.id);

        res.json({ ok: true, user, token });
      } catch (err) {
        console.error('Registration failed:', err);
        res.status(500).json({ ok: false, error: 'Registration failed. Try again.' });
      }
    });

    // Auth: Login
    app.post('/api/auth/login', async (req, res) => {
      try {
        const phone = sanitizePhone(req.body.phone);
        const password = String(req.body.password || '');

        if (!phone || !password) {
          return res.status(400).json({ ok: false, error: 'Phone number and password are required.' });
        }

        const user = await findUserByPhone(phone);
        if (!user) {
          return res.status(401).json({ ok: false, error: 'Incorrect phone number or password.' });
        }

        if (user.password_cleared) {
          return res.status(403).json({
            ok: false,
            passwordCleared: true,
            phone: user.phone,
            error: 'Your password was cleared by an administrator. Please recreate your password.'
          });
        }

        if (!verifyPassword(password, user.password_hash)) {
          return res.status(401).json({ ok: false, error: 'Incorrect phone number or password.' });
        }

        if (user.is_suspended) {
          return res.status(403).json({ ok: false, error: 'Your account has been suspended by an administrator.' });
        }

        delete user.password_hash;
        const token = generateToken(user.id);

        res.json({ ok: true, user, token });
      } catch (err) {
        console.error('Login failed:', err);
        res.status(500).json({ ok: false, error: 'Login failed. Try again.' });
      }
    });

    // Auth: Request Password Reset (Forgot Password)
    app.post('/api/auth/forgot-password', async (req, res) => {
      try {
        const phone = sanitizePhone(req.body.phone);
        if (!phone) {
          return res.status(400).json({ ok: false, error: 'Please enter a valid phone number.' });
        }

        const user = await findUserByPhone(phone);
        if (!user) {
          return res.status(404).json({ ok: false, error: 'No registered user found with this phone number.' });
        }

        if (user.is_suspended) {
          return res.status(403).json({ ok: false, error: 'Your account has been suspended by an administrator.' });
        }

        if (user.password_cleared) {
          return res.json({
            ok: true,
            passwordCleared: true,
            phone: user.phone,
            name: user.name,
            message: 'Your password has already been cleared by an administrator. You can recreate your password now!'
          });
        }

        // Flag password_reset_requested
        await pool.query(
          `UPDATE chat_users
           SET password_reset_requested = TRUE,
               password_reset_requested_at = now()
           WHERE id = $1`,
          [user.id]
        );

        // Notify any online administrators via socket
        io.emit('admin_user_event', {
          type: 'password_reset_requested',
          userId: user.id,
          name: user.name,
          phone: user.phone
        });

        res.json({
          ok: true,
          passwordCleared: false,
          phone: user.phone,
          name: user.name,
          message: 'Password reset request submitted. Please wait for an administrator to clear your password from the admin panel.'
        });
      } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ ok: false, error: 'Could not process password reset request.' });
      }
    });

    // Auth: Check if user's password was cleared by admin
    app.post('/api/auth/check-password-status', async (req, res) => {
      try {
        const phone = sanitizePhone(req.body.phone);
        if (!phone) {
          return res.status(400).json({ ok: false, error: 'Phone number is required.' });
        }

        const user = await findUserByPhone(phone);
        if (!user) {
          return res.status(404).json({ ok: false, error: 'No account found with this phone number.' });
        }

        res.json({
          ok: true,
          phone: user.phone,
          name: user.name,
          passwordCleared: Boolean(user.password_cleared),
          passwordResetRequested: Boolean(user.password_reset_requested)
        });
      } catch (err) {
        console.error('Check password status error:', err);
        res.status(500).json({ ok: false, error: 'Could not check password status.' });
      }
    });

    // Auth: Recreate password (only allowed after admin has cleared the password)
    app.post('/api/auth/recreate-password', async (req, res) => {
      try {
        const phone = sanitizePhone(req.body.phone);
        const newPassword = String(req.body.newPassword || req.body.password || '');

        if (!phone) {
          return res.status(400).json({ ok: false, error: 'Phone number is required.' });
        }
        if (newPassword.length < 6) {
          return res.status(400).json({ ok: false, error: 'New password must be at least 6 characters.' });
        }

        const user = await findUserByPhone(phone);
        if (!user) {
          return res.status(404).json({ ok: false, error: 'User not found.' });
        }

        if (user.is_suspended) {
          return res.status(403).json({ ok: false, error: 'Your account has been suspended by an administrator.' });
        }

        if (!user.password_cleared) {
          return res.status(403).json({
            ok: false,
            passwordCleared: false,
            error: 'Your password has not been cleared by an administrator yet. Please request a password reset first.'
          });
        }

        const hash = hashPassword(newPassword);
        await pool.query(
          `UPDATE chat_users
           SET password_hash = $1,
               password_cleared = FALSE,
               password_reset_requested = FALSE,
               password_reset_requested_at = NULL
           WHERE id = $2`,
          [hash, user.id]
        );

        const updatedUser = await getUserById(user.id);
        delete updatedUser.password_hash;
        const token = generateToken(updatedUser.id);

        res.json({
          ok: true,
          user: updatedUser,
          token,
          message: 'Password recreated successfully! You are now logged in.'
        });
      } catch (err) {
        console.error('Recreate password error:', err);
        res.status(500).json({ ok: false, error: 'Could not recreate password.' });
      }
    });

    // Auth: Me
    app.get('/api/auth/me', authMiddleware, (req, res) => {
      res.json({ ok: true, user: req.user });
    });
};
