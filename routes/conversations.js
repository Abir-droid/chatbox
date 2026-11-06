'use strict';

module.exports = function registerConversationRoutes(context) {
  const {
    app,
    pool,
    io,
    onlineUsers,
    authMiddleware,
    sanitizePhone,
    findUserByPhone,
    areFriends
  } = context;

  // Conversations: List for current user
  app.get('/api/conversations', authMiddleware, async (req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT c.id, c.type, c.name, c.avatar_url, c.created_at, c.updated_at, m.cleared_at, m.is_hidden, m.last_read_message_id
         FROM chat_conversations c
         JOIN chat_conversation_members m ON c.id = m.conversation_id
         WHERE m.user_id = $1
         ORDER BY c.updated_at DESC`,
        [req.user.id]
      );

        const conversations = [];
        for (const conv of rows) {
          const convId = Number(conv.id);
          const isHidden = Boolean(conv.is_hidden);
          const clearedAt = conv.cleared_at ? new Date(conv.cleared_at) : null;

          // Latest message for this user (only after cleared_at)
          let lastMsgRes;
          if (clearedAt) {
            lastMsgRes = await pool.query(
              `SELECT body, media_type, media_name, media_list, sender_name, created_at, is_deleted
               FROM chat_messages
               WHERE conversation_id = $1 AND is_deleted = FALSE AND created_at > $2
               ORDER BY id DESC LIMIT 1`,
              [convId, clearedAt]
            );
          } else {
            lastMsgRes = await pool.query(
              `SELECT body, media_type, media_name, media_list, sender_name, created_at, is_deleted
               FROM chat_messages
               WHERE conversation_id = $1 AND is_deleted = FALSE
               ORDER BY id DESC LIMIT 1`,
              [convId]
            );
          }

          // If hidden and no new messages arrived after cleared_at, omit from list
          if (isHidden && !lastMsgRes.rows.length) {
            continue;
          }

          // Calculate unread count for current user
          const lastReadId = Number(conv.last_read_message_id) || 0;
          let unreadCount = 0;
          if (clearedAt) {
            const unreadRes = await pool.query(
              `SELECT count(*)::int as count FROM chat_messages
               WHERE conversation_id = $1 AND id > $2 AND sender_id != $3 AND is_deleted = FALSE AND created_at > $4`,
              [convId, lastReadId, req.user.id, clearedAt]
            );
            unreadCount = unreadRes.rows[0].count;
          } else {
            const unreadRes = await pool.query(
              `SELECT count(*)::int as count FROM chat_messages
               WHERE conversation_id = $1 AND id > $2 AND sender_id != $3 AND is_deleted = FALSE`,
              [convId, lastReadId, req.user.id]
            );
            unreadCount = unreadRes.rows[0].count;
          }

          let displayName = conv.name;
          let displayPhone = null;
          let otherUserId = null;
          let avatarColor = 0;
          let avatarUrl = conv.avatar_url || null;
          let isOnline = false;

          if (conv.type === 'direct') {
            const otherRes = await pool.query(
              `SELECT u.id, u.name, u.phone, u.avatar_color, u.avatar_url
               FROM chat_conversation_members m
               JOIN chat_users u ON m.user_id = u.id
               WHERE m.conversation_id = $1 AND m.user_id != $2
               LIMIT 1`,
              [convId, req.user.id]
            );
            if (otherRes.rows.length) {
              const other = otherRes.rows[0];
              otherUserId = Number(other.id);
              displayName = other.name;
              displayPhone = other.phone;
              avatarColor = other.avatar_color;
              avatarUrl = other.avatar_url;
              isOnline = onlineUsers.has(otherUserId);
            } else {
              displayName = 'Direct Chat';
            }
          }

          // Member count
          const countRes = await pool.query(
            'SELECT count(*)::int as count FROM chat_conversation_members WHERE conversation_id = $1',
            [convId]
          );
          const memberCount = countRes.rows[0].count;

          let lastMsgText = '';
          if (lastMsgRes.rows.length) {
            const row = lastMsgRes.rows[0];
            lastMsgText = row.body || '';
            if (!lastMsgText) {
              if (row.media_type === 'audio') lastMsgText = '🎤 Voice note';
              else if (row.media_type === 'image') lastMsgText = '📷 Photo';
              else if (row.media_type === 'video') lastMsgText = '🎥 Video';
              else if (row.media_type === 'file') lastMsgText = `📎 ${row.media_name || 'Document'}`;
              else if (row.media_type) lastMsgText = `📎 ${row.media_name || 'Attachment'}`;
            }
          }

          const lastMessage = lastMsgRes.rows.length
            ? {
                text: lastMsgText,
                senderName: lastMsgRes.rows[0].sender_name,
                ts: new Date(lastMsgRes.rows[0].created_at).getTime(),
              }
            : null;

          conversations.push({
            id: convId,
            type: conv.type,
            name: displayName,
            phone: displayPhone,
            otherUserId,
            avatarColor,
            avatarUrl,
            memberCount,
            isOnline,
            lastMessage,
            unreadCount: Number(unreadCount) || 0,
            lastReadMessageId: lastReadId,
            updatedAt: new Date(conv.updated_at).getTime(),
          });
        }

        res.json({ ok: true, conversations });
      } catch (err) {
        console.error('Fetch conversations failed:', err);
        res.status(500).json({ ok: false, error: 'Could not load conversations.' });
      }
    });

    // Conversations: Start or open Direct Chat (Non-friends cannot talk)
    app.post('/api/conversations/direct', authMiddleware, async (req, res) => {
      try {
        const phone = sanitizePhone(req.body.phone);
        if (!phone) return res.status(400).json({ ok: false, error: 'Valid phone number required.' });

        const otherUser = await findUserByPhone(phone);
        if (!otherUser) {
          return res.status(404).json({ ok: false, error: 'No user registered with this phone number.' });
        }

        if (otherUser.id === req.user.id) {
          return res.status(400).json({ ok: false, error: 'Cannot start a direct chat with yourself.' });
        }

        const otherId = Number(otherUser.id);

        // Friend check: Non-friends cannot talk
        const isFriend = await areFriends(req.user.id, otherId);
        if (!isFriend) {
          return res.status(403).json({
            ok: false,
            error: 'You must be friends to start a direct chat. Send a friend request first.',
            requiresFriendRequest: true,
            user: { id: otherId, name: otherUser.name, phone: otherUser.phone, avatarColor: otherUser.avatar_color, avatarUrl: otherUser.avatar_url }
          });
        }

        // Check if direct conversation already exists
        const existingRes = await pool.query(
          `SELECT c.id
           FROM chat_conversations c
           JOIN chat_conversation_members m1 ON c.id = m1.conversation_id AND m1.user_id = $1
           JOIN chat_conversation_members m2 ON c.id = m2.conversation_id AND m2.user_id = $2
           WHERE c.type = 'direct'
           LIMIT 1`,
          [req.user.id, otherId]
        );

        let convId;
        if (existingRes.rows.length > 0) {
          convId = Number(existingRes.rows[0].id);
          // Unhide for current user if it was previously deleted/hidden
          await pool.query('UPDATE chat_conversation_members SET is_hidden = FALSE WHERE conversation_id = $1 AND user_id = $2', [convId, req.user.id]);
        } else {
          const createRes = await pool.query(
            "INSERT INTO chat_conversations (type, created_by) VALUES ('direct', $1) RETURNING id",
            [req.user.id]
          );
          convId = Number(createRes.rows[0].id);
          await pool.query(
            'INSERT INTO chat_conversation_members (conversation_id, user_id, role) VALUES ($1, $2, $3), ($1, $4, $5)',
            [convId, req.user.id, 'member', otherId, 'member']
          );
        }

        // Real-time broadcast to both users so neither has to refresh
        io.to(`u:${req.user.id}`).to(`u:${otherId}`).emit('conversation_created', {
          conversationId: convId,
        });

        res.json({
          ok: true,
          conversation: {
            id: convId,
            type: 'direct',
            name: otherUser.name,
            phone: otherUser.phone,
            otherUserId: otherId,
            avatarColor: otherUser.avatar_color,
            avatarUrl: otherUser.avatar_url,
            isOnline: onlineUsers.has(otherId),
          },
        });
      } catch (err) {
        console.error('Direct chat failed:', err);
        res.status(500).json({ ok: false, error: 'Could not create direct chat.' });
      }
    });

    // Conversations: Delete conversation for current user only ("Delete for me")
    app.delete('/api/conversations/:id', authMiddleware, async (req, res) => {
      try {
        const convId = Number(req.params.id);
        const memberCheck = await pool.query(
          'SELECT 1 FROM chat_conversation_members WHERE conversation_id = $1 AND user_id = $2',
          [convId, req.user.id]
        );
        if (!memberCheck.rows.length) {
          return res.status(403).json({ ok: false, error: 'You are not a member of this conversation.' });
        }

        // Set cleared_at and is_hidden for THIS user only. Other member(s) unaffected!
        await pool.query(
          'UPDATE chat_conversation_members SET cleared_at = now(), is_hidden = TRUE WHERE conversation_id = $1 AND user_id = $2',
          [convId, req.user.id]
        );

        res.json({ ok: true, conversationId: convId });
      } catch (err) {
        console.error('Delete conversation error:', err);
        res.status(500).json({ ok: false, error: 'Could not delete conversation.' });
      }
    });

    // Conversations: Mark as Read
    app.post('/api/conversations/:id/read', authMiddleware, async (req, res) => {
      try {
        const convId = Number(req.params.id);
        const maxMsg = await pool.query(
          'SELECT COALESCE(MAX(id), 0) as max_id FROM chat_messages WHERE conversation_id = $1',
          [convId]
        );
        const maxId = Number(maxMsg.rows[0].max_id);

        await pool.query(
          'UPDATE chat_conversation_members SET last_read_message_id = $1 WHERE conversation_id = $2 AND user_id = $3',
          [maxId, convId, req.user.id]
        );

        // Also mark others' messages as seen
        const seenRes = await pool.query(
          "UPDATE chat_messages SET status = 'seen' WHERE conversation_id = $1 AND sender_id != $2 AND status != 'seen'",
          [convId, req.user.id]
        );
        if (seenRes.rowCount > 0 && typeof io !== 'undefined') {
          io.to(`c:${convId}`).emit('conversation_seen', { conversationId: convId, seenBy: req.user.id });
        }

        if (typeof io !== 'undefined') {
          io.to(`u:${req.user.id}`).emit('unread_count_updated', { conversationId: convId, unreadCount: 0 });
        }

        res.json({ ok: true, conversationId: convId, unreadCount: 0 });
      } catch (err) {
        console.error('Mark read failed:', err);
        res.status(500).json({ ok: false, error: 'Could not mark conversation as read.' });
      }
    });

    // Conversations: Mark as Unread
    app.post('/api/conversations/:id/unread', authMiddleware, async (req, res) => {
      try {
        const convId = Number(req.params.id);

        // Find the latest message from someone else in this conversation
        const lastOtherMsg = await pool.query(
          'SELECT id FROM chat_messages WHERE conversation_id = $1 AND sender_id != $2 AND is_deleted = FALSE ORDER BY id DESC LIMIT 1',
          [convId, req.user.id]
        );

        let targetReadId = 0;
        if (lastOtherMsg.rows.length) {
          targetReadId = Number(lastOtherMsg.rows[0].id) - 1;
          if (targetReadId < 0) targetReadId = 0;
        }

        await pool.query(
          'UPDATE chat_conversation_members SET last_read_message_id = $1 WHERE conversation_id = $2 AND user_id = $3',
          [targetReadId, convId, req.user.id]
        );

        const unreadRes = await pool.query(
          `SELECT count(*)::int as count FROM chat_messages
           WHERE conversation_id = $1 AND id > $2 AND sender_id != $3 AND is_deleted = FALSE`,
          [convId, targetReadId, req.user.id]
        );
        const unreadCount = Number(unreadRes.rows[0].count) || 1;

        if (typeof io !== 'undefined') {
          io.to(`u:${req.user.id}`).emit('unread_count_updated', { conversationId: convId, unreadCount });
        }

        res.json({ ok: true, conversationId: convId, unreadCount });
      } catch (err) {
        console.error('Mark unread failed:', err);
        res.status(500).json({ ok: false, error: 'Could not mark conversation as unread.' });
      }
    });

    // Conversations: Create Group Chat
    app.post('/api/conversations/group', authMiddleware, async (req, res) => {
      try {
        const name = String(req.body.name || '').trim();
        const phones = Array.isArray(req.body.phones) ? req.body.phones : [];

        if (name.length < 2 || name.length > 40) {
          return res.status(400).json({ ok: false, error: 'Group name must be between 2 and 40 characters.' });
        }

        const createRes = await pool.query(
          "INSERT INTO chat_conversations (type, name, created_by) VALUES ('group', $1, $2) RETURNING id, name, created_at",
          [name, req.user.id]
        );
        const convId = Number(createRes.rows[0].id);

        // Add creator as admin
        await pool.query(
          "INSERT INTO chat_conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'admin')",
          [convId, req.user.id]
        );

        // Add member phones
        for (const rawPhone of phones) {
          const clean = sanitizePhone(rawPhone);
          if (!clean) continue;
          const u = await findUserByPhone(clean);
          if (u && u.id !== req.user.id) {
            await pool.query(
              "INSERT INTO chat_conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'member') ON CONFLICT DO NOTHING",
              [convId, u.id]
            );
          }
        }

        // Post system message
        await pool.query(
          'INSERT INTO chat_messages (conversation_id, sender_id, sender_name, body) VALUES ($1, $2, $3, $4)',
          [convId, req.user.id, 'System', `${req.user.name} created group "${name}"`]
        );

        // Notify online users via socket
        io.emit('conversation_created', { conversationId: convId });

        res.json({
          ok: true,
          conversation: {
            id: convId,
            type: 'group',
            name,
            created_by: req.user.id,
          },
        });
      } catch (err) {
        console.error('Create group failed:', err);
        res.status(500).json({ ok: false, error: 'Could not create group chat.' });
      }
    });

    // Conversations: Add Member to Group
    app.post('/api/conversations/:id/members', authMiddleware, async (req, res) => {
      try {
        const convId = Number(req.params.id);
        const phone = sanitizePhone(req.body.phone);

        if (!phone) return res.status(400).json({ ok: false, error: 'Valid phone number required.' });

        // Check if requester is a member of the group
        const memberCheck = await pool.query(
          'SELECT role FROM chat_conversation_members WHERE conversation_id = $1 AND user_id = $2',
          [convId, req.user.id]
        );
        if (!memberCheck.rows.length) {
          return res.status(403).json({ ok: false, error: 'You are not a member of this conversation.' });
        }

        const newUser = await findUserByPhone(phone);
        if (!newUser) {
          return res.status(404).json({ ok: false, error: 'No user registered with this phone number.' });
        }

        const newUserId = Number(newUser.id);

        const alreadyMember = await pool.query(
          'SELECT user_id FROM chat_conversation_members WHERE conversation_id = $1 AND user_id = $2',
          [convId, newUserId]
        );
        if (alreadyMember.rows.length) {
          return res.status(400).json({ ok: false, error: 'User is already a member of this group.' });
        }

        await pool.query(
          "INSERT INTO chat_conversation_members (conversation_id, user_id, role) VALUES ($1, $2, 'member')",
          [convId, newUserId]
        );

        // System message
        const sysMsgRes = await pool.query(
          'INSERT INTO chat_messages (conversation_id, sender_id, sender_name, body) VALUES ($1, $2, $3, $4) RETURNING id, created_at',
          [convId, req.user.id, 'System', `${req.user.name} added ${newUser.name} to the group`]
        );

        io.to(`c:${convId}`).emit('message', {
          id: Number(sysMsgRes.rows[0].id),
          conversationId: convId,
          senderId: req.user.id,
          senderName: 'System',
          text: `${req.user.name} added ${newUser.name} to the group`,
          ts: new Date(sysMsgRes.rows[0].created_at).getTime(),
          isSystem: true,
        });

        // Notify the added user directly to refresh their list
        io.to(`u:${newUserId}`).emit('conversation_added', { conversationId: convId });

        res.json({ ok: true, addedUser: { id: newUserId, name: newUser.name, phone: newUser.phone } });
      } catch (err) {
        console.error('Add member failed:', err);
        res.status(500).json({ ok: false, error: 'Could not add member.' });
      }
    });

    // Conversations: Update group profile photo
    app.post('/api/conversations/:id/avatar', authMiddleware, async (req, res) => {
      try {
        const convId = Number(req.params.id);
        if (!convId) return res.status(400).json({ ok: false, error: 'Invalid conversation.' });

        // Verify user is a member of this conversation
        const memberCheck = await pool.query(
          'SELECT role FROM chat_conversation_members WHERE conversation_id = $1 AND user_id = $2',
          [convId, req.user.id]
        );
        if (!memberCheck.rows.length) {
          return res.status(403).json({ ok: false, error: 'You are not a member of this group.' });
        }

        const convRes = await pool.query('SELECT type, name FROM chat_conversations WHERE id = $1', [convId]);
        if (!convRes.rows.length || convRes.rows[0].type !== 'group') {
          return res.status(400).json({ ok: false, error: 'Only group conversations have a group photo.' });
        }

        const avatarUrl = typeof req.body.avatarUrl === 'string' ? req.body.avatarUrl.trim() : (req.body.avatarUrl === null ? null : undefined);

        if (avatarUrl !== undefined) {
          await pool.query('UPDATE chat_conversations SET avatar_url = $1, updated_at = now() WHERE id = $2', [avatarUrl, convId]);
        }

        // Broadcast update to all group members
        const members = await pool.query('SELECT user_id FROM chat_conversation_members WHERE conversation_id = $1', [convId]);
        const targetRooms = [`c:${convId}`];
        for (const m of members.rows) {
          targetRooms.push(`u:${m.user_id}`);
        }

        io.to(targetRooms).emit('group_avatar_updated', {
          conversationId: convId,
          avatarUrl: avatarUrl || null,
        });

        res.json({ ok: true, avatarUrl: avatarUrl || null });
      } catch (err) {
        console.error('Update group avatar failed:', err);
        res.status(500).json({ ok: false, error: 'Could not update group photo.' });
      }
    });

    // Conversations: Get Members
    app.get('/api/conversations/:id/members', authMiddleware, async (req, res) => {
      try {
        const convId = Number(req.params.id);
        const { rows } = await pool.query(
          `SELECT u.id, u.name, u.phone, u.avatar_color, u.avatar_url, m.role, m.joined_at
           FROM chat_conversation_members m
           JOIN chat_users u ON m.user_id = u.id
           WHERE m.conversation_id = $1
           ORDER BY m.role DESC, u.name ASC`,
          [convId]
        );

        const members = rows.map((u) => ({
          id: Number(u.id),
          name: u.name,
          phone: u.phone,
          avatarColor: u.avatar_color,
          avatarUrl: u.avatar_url || null,
          role: u.role,
          isOnline: onlineUsers.has(Number(u.id)),
        }));

        res.json({ ok: true, members });
      } catch (err) {
        console.error('Get members failed:', err);
        res.status(500).json({ ok: false, error: 'Could not load group members.' });
      }
    });
};
