'use strict';

module.exports = function registerAdminRoutes(context) {
  const {
    app,
    pool,
    fs,
    path,
    UPLOADS_DIR,
    io,
    onlineUsers,
    authMiddleware,
    adminMiddleware,
    getUserById
  } = context;

  /* ------------------------------------------------------------- Admin routes */

    // Admin: Stats
    app.get('/api/admin/stats', authMiddleware, adminMiddleware, async (req, res) => {
      try {
        const usersRes = await pool.query('SELECT count(*)::int as count FROM chat_users');
        const messagesRes = await pool.query('SELECT count(*)::int as count FROM chat_messages');
        const groupsRes = await pool.query("SELECT count(*)::int as count FROM chat_conversations WHERE type = 'group'");
        const directsRes = await pool.query("SELECT count(*)::int as count FROM chat_conversations WHERE type = 'direct'");

        res.json({
          ok: true,
          stats: {
            totalUsers: usersRes.rows[0].count,
            activeUsersOnline: onlineUsers.size,
            totalMessages: messagesRes.rows[0].count,
            totalGroups: groupsRes.rows[0].count,
            totalDirectChats: directsRes.rows[0].count,
          },
        });
      } catch (err) {
        console.error('Admin stats error:', err);
        res.status(500).json({ ok: false, error: 'Could not load admin stats.' });
      }
    });

    // Admin: List all registered users
    app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
      try {
        const { rows } = await pool.query(`
          SELECT u.id, u.phone, u.name, u.avatar_color, u.is_admin, u.is_suspended,
                 u.password_cleared, u.password_reset_requested, u.password_reset_requested_at,
                 u.created_at,
                 count(m.id)::int as message_count
          FROM chat_users u
          LEFT JOIN chat_messages m ON u.id = m.sender_id
          GROUP BY u.id
          ORDER BY u.id DESC
        `);

        const users = rows.map((u) => ({
          id: Number(u.id),
          phone: u.phone,
          name: u.name,
          avatarColor: u.avatar_color,
          isAdmin: u.is_admin,
          isSuspended: u.is_suspended,
          passwordCleared: Boolean(u.password_cleared),
          passwordResetRequested: Boolean(u.password_reset_requested),
          passwordResetRequestedAt: u.password_reset_requested_at ? new Date(u.password_reset_requested_at).getTime() : null,
          messageCount: u.message_count,
          isOnline: onlineUsers.has(Number(u.id)),
          createdAt: new Date(u.created_at).getTime(),
        }));

        res.json({ ok: true, users });
      } catch (err) {
        console.error('Admin list users error:', err);
        res.status(500).json({ ok: false, error: 'Could not load users.' });
      }
    });

    // Admin: Clear user password (allows user to recreate password via forgot password flow)
    app.post('/api/admin/users/:id/clear-password', authMiddleware, adminMiddleware, async (req, res) => {
      try {
        const targetId = Number(req.params.id);
        if (targetId === req.user.id) {
          return res.status(400).json({ ok: false, error: 'You cannot clear your own admin password from here. Please use profile settings to change your password.' });
        }

        const targetUser = await getUserById(targetId);
        if (!targetUser) {
          return res.status(404).json({ ok: false, error: 'User not found.' });
        }

        await pool.query(
          `UPDATE chat_users
           SET password_hash = '',
               password_cleared = TRUE,
               password_reset_requested = FALSE,
               password_reset_requested_at = NULL
           WHERE id = $1`,
          [targetId]
        );

        // Disconnect active socket sessions for this user
        for (const [socketId, socket] of io.sockets.sockets) {
          if (socket.user && socket.user.id === targetId) {
            socket.emit('password_cleared');
            socket.disconnect(true);
          }
        }
        onlineUsers.delete(targetId);

        // Notify any online admins to refresh their user list
        io.emit('admin_user_event', { type: 'password_cleared', userId: targetId });

        res.json({
          ok: true,
          targetId,
          message: `Password cleared for ${targetUser.name} (${targetUser.phone}). The user can now recreate their password.`
        });
      } catch (err) {
        console.error('Admin clear password error:', err);
        res.status(500).json({ ok: false, error: 'Could not clear user password.' });
      }
    });

    // Admin: Block / Suspend / Unsuspend user
    app.post('/api/admin/users/:id/suspend', authMiddleware, adminMiddleware, async (req, res) => {
      try {
        const targetId = Number(req.params.id);
        const suspend = Boolean(req.body.suspend);

        if (targetId === req.user.id) {
          return res.status(400).json({ ok: false, error: 'You cannot suspend your own account.' });
        }

        await pool.query('UPDATE chat_users SET is_suspended = $1 WHERE id = $2', [suspend, targetId]);

        if (suspend) {
          // Disconnect any active sockets for this user immediately
          for (const [socketId, socket] of io.sockets.sockets) {
            if (socket.user && socket.user.id === targetId) {
              socket.emit('account_suspended');
              socket.disconnect(true);
            }
          }
          onlineUsers.delete(targetId);
        }

        res.json({ ok: true, targetId, suspended: suspend });
      } catch (err) {
        console.error('Admin suspend error:', err);
        res.status(500).json({ ok: false, error: 'Could not change user status.' });
      }
    });

    // Admin: Permanently Delete User Account (and delete their entire chat history & files)
    app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
      try {
        const targetId = Number(req.params.id);

        if (targetId === req.user.id) {
          return res.status(400).json({ ok: false, error: 'You cannot delete your own admin account.' });
        }

        const targetUser = await getUserById(targetId);
        if (!targetUser) {
          return res.status(404).json({ ok: false, error: 'User not found.' });
        }

        // 1. Gather all files uploaded by this user in chat messages to unlink from disk
        const filesToDelete = [];
        if (targetUser.avatar_url) {
          filesToDelete.push(targetUser.avatar_url);
        }
        const userMsgsRes = await pool.query(
          'SELECT media_url, media_list FROM chat_messages WHERE sender_id = $1',
          [targetId]
        );
        for (const r of userMsgsRes.rows) {
          if (r.media_url) filesToDelete.push(r.media_url);
          if (r.media_list) {
            try {
              const list = typeof r.media_list === 'string' ? JSON.parse(r.media_list) : r.media_list;
              if (Array.isArray(list)) {
                list.forEach((m) => { if (m && m.url) filesToDelete.push(m.url); });
              }
            } catch {}
          }
        }

        // Also gather direct conversations where target user is participant to delete their files too
        const directConvsRes = await pool.query(
          `SELECT c.id FROM chat_conversations c
           JOIN chat_conversation_members m ON c.id = m.conversation_id
           WHERE c.type = 'direct' AND m.user_id = $1`,
          [targetId]
        );
        const directConvIds = directConvsRes.rows.map((r) => Number(r.id));
        if (directConvIds.length > 0) {
          const placeholders = directConvIds.map((_, i) => `$${i + 1}`).join(',');
          const directMsgsRes = await pool.query(
            `SELECT media_url, media_list FROM chat_messages WHERE conversation_id IN (${placeholders})`,
            directConvIds
          );
          for (const r of directMsgsRes.rows) {
            if (r.media_url) filesToDelete.push(r.media_url);
            if (r.media_list) {
              try {
                const list = typeof r.media_list === 'string' ? JSON.parse(r.media_list) : r.media_list;
                if (Array.isArray(list)) {
                  list.forEach((m) => { if (m && m.url) filesToDelete.push(m.url); });
                }
              } catch {}
            }
          }
        }

        // Unlink all accumulated files from disk
        for (const mUrl of filesToDelete) {
          try {
            const parts = mUrl.split('/static/uploads/');
            if (parts.length > 1) {
              const fname = path.basename(parts[1]);
              const filePath = path.join(UPLOADS_DIR, fname);
              if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
              await pool.query('DELETE FROM chat_media_files WHERE filename = $1', [fname]).catch(() => {});
            }
          } catch (e) {}
        }

        // 2. Delete all direct conversations where this user participated
        if (directConvIds.length > 0) {
          const placeholders = directConvIds.map((_, i) => `$${i + 1}`).join(',');
          await pool.query(`DELETE FROM chat_conversations WHERE id IN (${placeholders})`, directConvIds);
        }

        // 3. Delete messages sent by user in remaining conversations (like groups)
        await pool.query('DELETE FROM chat_messages WHERE sender_id = $1', [targetId]);

        // 4. Delete friend requests and friends relationships
        await pool.query('DELETE FROM chat_friend_requests WHERE sender_id = $1 OR receiver_id = $1', [targetId]);
        await pool.query('DELETE FROM chat_friends WHERE user_id = $1 OR friend_id = $1', [targetId]);

        // 5. Delete group memberships
        await pool.query('DELETE FROM chat_conversation_members WHERE user_id = $1', [targetId]);

        // 6. Delete the user row
        await pool.query('DELETE FROM chat_users WHERE id = $1', [targetId]);

        // 7. Disconnect active sockets for this user immediately
        for (const [socketId, socket] of io.sockets.sockets) {
          if (socket.user && socket.user.id === targetId) {
            socket.emit('account_deleted');
            socket.disconnect(true);
          }
        }
        onlineUsers.delete(targetId);

        // Notify other connected clients to refresh conversations/friends
        io.emit('user_deleted', { userId: targetId });

        res.json({ ok: true, targetId, message: `User ${targetUser.name} and all their chat data were permanently deleted.` });
      } catch (err) {
        console.error('Admin delete user error:', err);
        res.status(500).json({ ok: false, error: 'Could not delete user account.' });
      }
    });

    // Admin: List all conversations for audit
    app.get('/api/admin/conversations', authMiddleware, adminMiddleware, async (req, res) => {
      try {
        const { rows } = await pool.query(`
          SELECT c.id, c.type, c.name, c.created_at, c.updated_at,
                 count(DISTINCT m.user_id)::int as member_count,
                 count(msg.id)::int as total_messages,
                 count(CASE WHEN msg.is_deleted = TRUE THEN 1 END)::int as deleted_messages
          FROM chat_conversations c
          LEFT JOIN chat_conversation_members m ON c.id = m.conversation_id
          LEFT JOIN chat_messages msg ON c.id = msg.conversation_id
          GROUP BY c.id
          ORDER BY c.updated_at DESC
        `);

        const conversations = rows.map((c) => ({
          id: Number(c.id),
          type: c.type,
          name: c.name || `Direct Chat #${c.id}`,
          memberCount: c.member_count,
          totalMessages: c.total_messages,
          deletedMessages: c.deleted_messages,
          updatedAt: new Date(c.updated_at).getTime(),
        }));

        res.json({ ok: true, conversations });
      } catch (err) {
        console.error('Admin conversations error:', err);
        res.status(500).json({ ok: false, error: 'Could not load conversations.' });
      }
    });



    // Admin: Change user role (promote to admin or demote to regular user)
    app.post('/api/admin/users/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
      try {
        const targetId = Number(req.params.id);
        const isAdmin = Boolean(req.body.isAdmin);

        if (targetId === req.user.id && !isAdmin) {
          return res.status(400).json({ ok: false, error: 'You cannot remove your own admin status.' });
        }

        await pool.query('UPDATE chat_users SET is_admin = $1 WHERE id = $2', [isAdmin, targetId]);

        // Real-time notification to user
        io.to(`u:${targetId}`).emit('role_changed', { isAdmin });

        res.json({ ok: true, targetId, isAdmin });
      } catch (err) {
        console.error('Change user role error:', err);
        res.status(500).json({ ok: false, error: 'Could not update user role.' });
      }
    });
};
