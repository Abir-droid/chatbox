'use strict';

module.exports = function registerContactRoutes(context) {
  const {
    app,
    pool,
    io,
    onlineUsers,
    authMiddleware,
    sanitizePhone,
    findUserByPhone,
    areFriends,
    getUserById,
    hashPassword
  } = context;

  // Profile: Update current user's profile
  app.post('/api/profile', authMiddleware, async (req, res) => {
    try {
      const name = typeof req.body.name === 'string' ? req.body.name.trim() : null;
      const avatarColor = typeof req.body.avatarColor === 'number' ? req.body.avatarColor : null;
      const avatarUrl = typeof req.body.avatarUrl === 'string' ? req.body.avatarUrl.trim() : (req.body.avatarUrl === null ? null : undefined);
      const password = typeof req.body.password === 'string' ? req.body.password : null;

        if (name !== null) {
          if (name.length < 2 || name.length > 50) {
            return res.status(400).json({ ok: false, error: 'Name must be between 2 and 50 characters.' });
          }
          await pool.query('UPDATE chat_users SET name = $1 WHERE id = $2', [name, req.user.id]);
        }

        if (avatarColor !== null && avatarColor >= 0 && avatarColor <= 9) {
          await pool.query('UPDATE chat_users SET avatar_color = $1 WHERE id = $2', [avatarColor, req.user.id]);
        }

        if (avatarUrl !== undefined) {
          await pool.query('UPDATE chat_users SET avatar_url = $1 WHERE id = $2', [avatarUrl, req.user.id]);
        }

        if (password && password.length >= 6) {
          const hash = hashPassword(password);
          await pool.query('UPDATE chat_users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
        }

        const updatedUser = await getUserById(req.user.id);
        io.emit('user_profile_updated', {
          userId: req.user.id,
          name: updatedUser.name,
          avatarColor: updatedUser.avatar_color,
          avatarUrl: updatedUser.avatar_url,
        });

        res.json({ ok: true, user: updatedUser });
      } catch (err) {
        console.error('Update profile failed:', err);
        res.status(500).json({ ok: false, error: 'Could not update profile.' });
      }
    });

    // Friends: List
    app.get('/api/friends', authMiddleware, async (req, res) => {
      try {
        const { rows } = await pool.query(
          `SELECT u.id, u.phone, u.name, u.avatar_color, u.avatar_url, u.is_suspended
           FROM chat_friends f
           JOIN chat_users u ON f.friend_id = u.id
           WHERE f.user_id = $1
           ORDER BY u.name ASC`,
          [req.user.id]
        );

        const friends = rows.map((u) => ({
          id: Number(u.id),
          phone: u.phone,
          name: u.name,
          avatarColor: u.avatar_color,
          avatarUrl: u.avatar_url,
          isOnline: onlineUsers.has(Number(u.id)),
        }));

        res.json({ ok: true, friends });
      } catch (err) {
        console.error('Fetch friends failed:', err);
        res.status(500).json({ ok: false, error: 'Could not load friends.' });
      }
    });

    // Friends: Add by phone (Mutual friendship for instant connect & test compatibility)
    app.post('/api/friends/add', authMiddleware, async (req, res) => {
      try {
        const phone = sanitizePhone(req.body.phone);
        if (!phone) {
          return res.status(400).json({ ok: false, error: 'Please enter a valid phone number.' });
        }

        const friend = await findUserByPhone(phone);
        if (!friend) {
          return res.status(404).json({ ok: false, error: 'No user registered with this phone number.' });
        }

        if (friend.id === req.user.id) {
          return res.status(400).json({ ok: false, error: 'You cannot add yourself as a friend.' });
        }

        // Mutual friendship
        await pool.query(
          'INSERT INTO chat_friends (user_id, friend_id) VALUES ($1, $2), ($2, $1) ON CONFLICT DO NOTHING',
          [req.user.id, friend.id]
        );

        // Also mark any friend requests between them as accepted
        await pool.query(
          `UPDATE chat_friend_requests SET status = 'accepted', updated_at = now()
           WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)`,
          [req.user.id, friend.id]
        );

        res.json({
          ok: true,
          friend: {
            id: friend.id,
            phone: friend.phone,
            name: friend.name,
            avatarColor: friend.avatar_color,
            avatarUrl: friend.avatar_url,
            isOnline: onlineUsers.has(friend.id),
          },
        });
      } catch (err) {
        console.error('Add friend failed:', err);
        res.status(500).json({ ok: false, error: 'Could not add friend.' });
      }
    });

    // Friends: Unfriend / Remove Friend
    app.delete(['/api/friends/:id', '/api/friends/:id/unfriend'], authMiddleware, async (req, res) => {
      try {
        const friendId = Number(req.params.id);
        if (!friendId) {
          return res.status(400).json({ ok: false, error: 'Valid friend ID required.' });
        }

        if (friendId === req.user.id) {
          return res.status(400).json({ ok: false, error: 'Cannot unfriend yourself.' });
        }

        // Delete mutual friendship
        await pool.query(
          'DELETE FROM chat_friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)',
          [req.user.id, friendId]
        );

        // Delete existing friend requests between them so clean slate
        await pool.query(
          'DELETE FROM chat_friend_requests WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)',
          [req.user.id, friendId]
        );

        // Broadcast friend removal in real-time to both users
        io.to(`u:${req.user.id}`).to(`u:${friendId}`).emit('friend_removed', {
          userId: req.user.id,
          friendId,
        });

        res.json({ ok: true, friendId, message: 'Unfriended successfully.' });
      } catch (err) {
        console.error('Unfriend failed:', err);
        res.status(500).json({ ok: false, error: 'Could not remove friend.' });
      }
    });

    // Friend Requests: Send request
    app.post('/api/friends/request', authMiddleware, async (req, res) => {
      try {
        const phone = sanitizePhone(req.body.phone);
        if (!phone) return res.status(400).json({ ok: false, error: 'Please enter a valid phone number.' });

        const targetUser = await findUserByPhone(phone);
        if (!targetUser) return res.status(404).json({ ok: false, error: 'No user registered with this phone number.' });

        if (targetUser.id === req.user.id) return res.status(400).json({ ok: false, error: 'You cannot send a friend request to yourself.' });

        const targetId = Number(targetUser.id);

        // Check if already friends
        const isFriend = await areFriends(req.user.id, targetId);
        if (isFriend) return res.status(400).json({ ok: false, error: 'You are already friends with this user.' });

        // Check if reverse request exists and is pending -> auto accept!
        const reverseReq = await pool.query(
          "SELECT id FROM chat_friend_requests WHERE sender_id = $1 AND receiver_id = $2 AND status = 'pending'",
          [targetId, req.user.id]
        );
        if (reverseReq.rows.length) {
          await pool.query("UPDATE chat_friend_requests SET status = 'accepted', updated_at = now() WHERE id = $1", [reverseReq.rows[0].id]);
          await pool.query(
            'INSERT INTO chat_friends (user_id, friend_id) VALUES ($1, $2), ($2, $1) ON CONFLICT DO NOTHING',
            [req.user.id, targetId]
          );
          io.to(`u:${targetId}`).emit('friend_request_accepted', {
            friend: { id: req.user.id, name: req.user.name, phone: req.user.phone, avatarColor: req.user.avatar_color, avatarUrl: req.user.avatar_url }
          });
          return res.json({ ok: true, status: 'accepted', message: `You and ${targetUser.name} are now friends!` });
        }

        // Insert or update pending request
        await pool.query(
          `INSERT INTO chat_friend_requests (sender_id, receiver_id, status, updated_at)
           VALUES ($1, $2, 'pending', now())
           ON CONFLICT (sender_id, receiver_id)
           DO UPDATE SET status = 'pending', updated_at = now()`,
          [req.user.id, targetId]
        );

        io.to(`u:${targetId}`).emit('friend_request_received', {
          sender: {
            id: req.user.id,
            name: req.user.name,
            phone: req.user.phone,
            avatarColor: req.user.avatar_color,
            avatarUrl: req.user.avatar_url,
          }
        });

        res.json({ ok: true, status: 'pending', message: 'Friend request sent successfully.' });
      } catch (err) {
        console.error('Send friend request failed:', err);
        res.status(500).json({ ok: false, error: 'Could not send friend request.' });
      }
    });

    // Friend Requests: List incoming pending requests
    app.get('/api/friends/requests', authMiddleware, async (req, res) => {
      try {
        const { rows } = await pool.query(
          `SELECT r.id, r.sender_id, r.created_at, u.name, u.phone, u.avatar_color, u.avatar_url
           FROM chat_friend_requests r
           JOIN chat_users u ON r.sender_id = u.id
           WHERE r.receiver_id = $1 AND r.status = 'pending'
           ORDER BY r.created_at DESC`,
          [req.user.id]
        );

        const requests = rows.map((r) => ({
          id: Number(r.id),
          senderId: Number(r.sender_id),
          name: r.name,
          phone: r.phone,
          avatarColor: r.avatar_color,
          avatarUrl: r.avatar_url,
          createdAt: new Date(r.created_at).getTime(),
        }));

        res.json({ ok: true, requests });
      } catch (err) {
        console.error('Fetch friend requests failed:', err);
        res.status(500).json({ ok: false, error: 'Could not load friend requests.' });
      }
    });

    // Friend Requests: Accept
    app.post('/api/friends/requests/:id/accept', authMiddleware, async (req, res) => {
      try {
        const reqId = Number(req.params.id);
        const { rows } = await pool.query(
          "SELECT sender_id, receiver_id FROM chat_friend_requests WHERE id = $1 AND receiver_id = $2 AND status = 'pending'",
          [reqId, req.user.id]
        );
        if (!rows.length) {
          return res.status(404).json({ ok: false, error: 'Friend request not found or already handled.' });
        }

        const senderId = Number(rows[0].sender_id);
        await pool.query("UPDATE chat_friend_requests SET status = 'accepted', updated_at = now() WHERE id = $1", [reqId]);
        await pool.query(
          'INSERT INTO chat_friends (user_id, friend_id) VALUES ($1, $2), ($2, $1) ON CONFLICT DO NOTHING',
          [req.user.id, senderId]
        );

        const sender = await getUserById(senderId);
        io.to(`u:${senderId}`).emit('friend_request_accepted', {
          friend: { id: req.user.id, name: req.user.name, phone: req.user.phone, avatarColor: req.user.avatar_color, avatarUrl: req.user.avatar_url }
        });
        io.to(`u:${req.user.id}`).emit('friend_request_accepted', {
          friend: { id: senderId, name: sender ? sender.name : 'Friend', phone: sender ? sender.phone : '', avatarColor: sender ? sender.avatar_color : 0, avatarUrl: sender ? sender.avatar_url : null }
        });

        res.json({
          ok: true,
          friend: {
            id: senderId,
            name: sender ? sender.name : 'Friend',
            phone: sender ? sender.phone : '',
            avatarColor: sender ? sender.avatar_color : 0,
            avatarUrl: sender ? sender.avatar_url : null,
          }
        });
      } catch (err) {
        console.error('Accept friend request failed:', err);
        res.status(500).json({ ok: false, error: 'Could not accept friend request.' });
      }
    });

    // Friend Requests: Decline
    app.post('/api/friends/requests/:id/decline', authMiddleware, async (req, res) => {
      try {
        const reqId = Number(req.params.id);
        await pool.query(
          "UPDATE chat_friend_requests SET status = 'declined', updated_at = now() WHERE id = $1 AND receiver_id = $2",
          [reqId, req.user.id]
        );
        res.json({ ok: true });
      } catch (err) {
        console.error('Decline friend request failed:', err);
        res.status(500).json({ ok: false, error: 'Could not decline friend request.' });
      }
    });
};
