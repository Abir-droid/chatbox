'use strict';

let fetchLinkPreview;
try {
  fetchLinkPreview = require('./link-preview').fetchLinkPreview;
} catch {
  fetchLinkPreview = require('../link-preview').fetchLinkPreview;
}

module.exports = function registerMessageRoutes(context) {
  const {
    app,
    pool,
    fs,
    path,
    UPLOADS_DIR,
    PREFIX,
    io,
    authMiddleware,
    upload,
    processUploadedFile,
    persistMediaFile,
    getMessagesReactions
  } = context;

  // Messages: Load History for Conversation (filtered by user's cleared_at)
  app.get('/api/conversations/:id/messages', authMiddleware, async (req, res) => {
    try {
      const convId = Number(req.params.id);

        // Verify membership and fetch cleared_at and last_read_message_id
        const memberCheck = await pool.query(
          'SELECT cleared_at, last_read_message_id FROM chat_conversation_members WHERE conversation_id = $1 AND user_id = $2',
          [convId, req.user.id]
        );
        if (!memberCheck.rows.length) {
          return res.status(403).json({ ok: false, error: 'You are not a member of this conversation.' });
        }

        const userLastReadMessageId = Number(memberCheck.rows[0].last_read_message_id) || 0;
        const clearedAt = memberCheck.rows[0].cleared_at ? new Date(memberCheck.rows[0].cleared_at) : null;
        let rows;
        if (clearedAt) {
          const q = await pool.query(
            `SELECT m.id, m.conversation_id, m.sender_id, m.sender_name, m.body, m.media_url, m.media_type, m.media_name, m.media_list,
                    m.reply_to_id, m.reply_to_sender, m.reply_to_text, m.status, m.is_edited, m.edited_at, m.created_at,
                    u.avatar_url AS sender_avatar_url, u.avatar_color AS sender_avatar_color
             FROM chat_messages m
             LEFT JOIN chat_users u ON m.sender_id = u.id
             WHERE m.conversation_id = $1 AND m.is_deleted = FALSE AND m.created_at > $2
             ORDER BY m.id DESC LIMIT 100`,
            [convId, clearedAt]
          );
          rows = q.rows;
        } else {
          const q = await pool.query(
            `SELECT m.id, m.conversation_id, m.sender_id, m.sender_name, m.body, m.media_url, m.media_type, m.media_name, m.media_list,
                    m.reply_to_id, m.reply_to_sender, m.reply_to_text, m.status, m.is_edited, m.edited_at, m.created_at,
                    u.avatar_url AS sender_avatar_url, u.avatar_color AS sender_avatar_color
             FROM chat_messages m
             LEFT JOIN chat_users u ON m.sender_id = u.id
             WHERE m.conversation_id = $1 AND m.is_deleted = FALSE
             ORDER BY m.id DESC LIMIT 100`,
            [convId]
          );
          rows = q.rows;
        }

        // Automatically mark messages from others in this conversation as seen
        try {
          const seenRes = await pool.query(
            "UPDATE chat_messages SET status = 'seen' WHERE conversation_id = $1 AND sender_id != $2 AND status != 'seen'",
            [convId, req.user.id]
          );
          if (seenRes.rowCount > 0 && typeof io !== 'undefined') {
            io.to(`c:${convId}`).emit('conversation_seen', { conversationId: convId, seenBy: req.user.id });
          }
        } catch (e) {}

        // Check which media files actually exist on disk or in chat_media_files
        const referencedFiles = new Set();
        for (const r of rows) {
          if (r.media_url && r.media_url.includes('/static/uploads/')) {
            referencedFiles.add(path.basename(r.media_url.split('/static/uploads/')[1].split('?')[0]));
          }
          if (r.media_list) {
            try {
              const list = typeof r.media_list === 'string' ? JSON.parse(r.media_list) : r.media_list;
              if (Array.isArray(list)) {
                for (const it of list) {
                  if (it && it.url && it.url.includes('/static/uploads/')) {
                    referencedFiles.add(path.basename(it.url.split('/static/uploads/')[1].split('?')[0]));
                  }
                }
              }
            } catch {}
          }
        }

        const existingFiles = new Set();
        if (referencedFiles.size > 0) {
          const fileArr = Array.from(referencedFiles);
          for (const fname of fileArr) {
            if (fs.existsSync(path.join(UPLOADS_DIR, fname))) {
              existingFiles.add(fname);
            }
          }
          const missingFromDisk = fileArr.filter((f) => !existingFiles.has(f));
          if (missingFromDisk.length > 0) {
            try {
              const dbFiles = await pool.query(
                'SELECT filename FROM chat_media_files WHERE filename = ANY($1)',
                [missingFromDisk]
              );
              for (const row of dbFiles.rows) {
                existingFiles.add(row.filename);
              }
            } catch (e) {}
          }
        }

        const messageIds = rows.map((r) => Number(r.id));
        const reactionsMap = await getMessagesReactions(messageIds);

        const messages = rows
          .map((r) => {
            let mediaList = null;
            if (r.media_list) {
              try {
                mediaList = typeof r.media_list === 'string' ? JSON.parse(r.media_list) : r.media_list;
              } catch {}
            }
            if (!mediaList && r.media_url) {
              mediaList = [{ url: r.media_url, mediaType: r.media_type, mediaName: r.media_name }];
            }

            let hasMissingMedia = false;
            if (Array.isArray(mediaList)) {
              mediaList = mediaList.map((m) => {
                if (!m || !m.url) return m;
                let missing = false;
                if (m.url.includes('/static/uploads/')) {
                  const fname = path.basename(m.url.split('/static/uploads/')[1].split('?')[0]);
                  missing = !existingFiles.has(fname);
                }
                if (missing) hasMissingMedia = true;
                return { ...m, missing };
              });
            }

            return {
              id: Number(r.id),
              conversationId: Number(r.conversation_id),
              senderId: Number(r.sender_id),
              senderName: r.sender_name,
              senderAvatarUrl: r.sender_avatar_url || null,
              senderAvatarColor: typeof r.sender_avatar_color === 'number' ? r.sender_avatar_color : 0,
              text: r.body,
              mediaUrl: r.media_url,
              mediaType: r.media_type,
              mediaName: r.media_name,
              mediaList,
              mediaMissing: hasMissingMedia,
              replyToId: r.reply_to_id ? Number(r.reply_to_id) : null,
              replyToSender: r.reply_to_sender || null,
              replyToText: r.reply_to_text || null,
              status: r.status || 'sent',
              isEdited: !!r.is_edited,
              editedAt: r.edited_at ? new Date(r.edited_at).getTime() : null,
              reactions: reactionsMap[Number(r.id)] || [],
              ts: new Date(r.created_at).getTime(),
            };
          })
          .reverse();

        const unreadMsgs = messages.filter((m) => m.id > userLastReadMessageId && m.senderId !== req.user.id);
        const firstUnreadMessageId = unreadMsgs.length > 0 ? unreadMsgs[0].id : null;

        // Update last_read_message_id to latest message id for current user
        const latestMsgId = messages.length > 0 ? messages[messages.length - 1].id : 0;
        if (latestMsgId > 0) {
          await pool.query(
            'UPDATE chat_conversation_members SET last_read_message_id = GREATEST(COALESCE(last_read_message_id, 0), $1) WHERE conversation_id = $2 AND user_id = $3',
            [latestMsgId, convId, req.user.id]
          );
          if (typeof io !== 'undefined') {
            io.to(`u:${req.user.id}`).emit('unread_count_updated', { conversationId: convId, unreadCount: 0 });
          }
        }

        res.json({ ok: true, messages, firstUnreadMessageId, lastReadMessageId: userLastReadMessageId });
      } catch (err) {
        console.error('Load messages failed:', err);
        res.status(500).json({ ok: false, error: 'Could not load messages.' });
      }
    });

    // Media: Load all shared media for a conversation (Photos, Videos, Files, Voice notes)
    app.get('/api/conversations/:id/media', authMiddleware, async (req, res) => {
      try {
        const convId = Number(req.params.id);
        const memberCheck = await pool.query(
          'SELECT cleared_at FROM chat_conversation_members WHERE conversation_id = $1 AND user_id = $2',
          [convId, req.user.id]
        );
        if (!memberCheck.rows.length) {
          return res.status(403).json({ ok: false, error: 'You are not a member of this conversation.' });
        }

        const clearedAt = memberCheck.rows[0].cleared_at ? new Date(memberCheck.rows[0].cleared_at) : null;
        let query = `
          SELECT id, sender_name, sender_id, media_url, media_type, media_name, media_list, created_at
          FROM chat_messages
          WHERE conversation_id = $1 AND is_deleted = FALSE AND (media_url IS NOT NULL OR media_list IS NOT NULL)
        `;
        const params = [convId];
        if (clearedAt) {
          query += ` AND created_at > $2`;
          params.push(clearedAt);
        }
        query += ` ORDER BY id DESC`;

        const { rows } = await pool.query(query, params);

        const photos = [];
        const videos = [];
        const files = [];
        const audio = [];

        for (const r of rows) {
          const ts = new Date(r.created_at).getTime();
          let list = null;
          if (r.media_list) {
            try {
              list = typeof r.media_list === 'string' ? JSON.parse(r.media_list) : r.media_list;
            } catch {}
          }
          if (!list || !list.length) {
            if (r.media_url) {
              list = [{ url: r.media_url, mediaType: r.media_type, mediaName: r.media_name }];
            }
          }

          if (Array.isArray(list)) {
            for (const item of list) {
              if (!item || !item.url) continue;
              const rawType = (item.mediaType || '').toLowerCase();
              const rawName = (item.mediaName || '').toLowerCase();
              const url = item.url;
              const isAudio =
                rawType === 'audio' ||
                rawType.startsWith('audio/') ||
                rawName.includes('voice note') ||
                /\.(webm|ogg|wav|mp3|m4a|aac|opus)(\?|$)/i.test(url);
              const isVideo =
                !isAudio &&
                (rawType === 'video' ||
                 rawType.startsWith('video/') ||
                 /\.(mp4|mov|mkv)(\?|$)/i.test(url));
              const isImage =
                !isAudio && !isVideo &&
                (rawType === 'image' ||
                 rawType.startsWith('image/') ||
                 /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url));

              const entry = {
                msgId: Number(r.id),
                url,
                mediaType: isAudio ? 'audio' : (isVideo ? 'video' : (isImage ? 'image' : 'file')),
                mediaName: item.mediaName || (isAudio ? 'Voice Note' : (isVideo ? 'Video' : (isImage ? 'Photo' : 'Document'))),
                senderName: r.sender_name,
                ts,
              };

              if (isImage) {
                photos.push(entry);
              } else if (isVideo) {
                videos.push(entry);
              } else if (isAudio) {
                audio.push(entry);
              } else {
                files.push(entry);
              }
            }
          }
        }

        res.json({
          ok: true,
          photos,
          videos,
          files,
          audio,
          counts: {
            photos: photos.length,
            videos: videos.length,
            files: files.length,
            audio: audio.length,
          },
        });
      } catch (err) {
        console.error('Fetch conversation media failed:', err);
        res.status(500).json({ ok: false, error: 'Could not load conversation media.' });
      }
    });

    function inspectFileMediaType(file) {
      const mime = (file.mimetype || '').toLowerCase();
      const orig = (file.originalname || '').toLowerCase();
      const isAudio =
        orig.startsWith('voice-') ||
        mime.startsWith('audio/') ||
        orig.endsWith('.webm') ||
        orig.endsWith('.ogg') ||
        orig.endsWith('.wav') ||
        orig.endsWith('.mp3') ||
        orig.endsWith('.m4a') ||
        orig.endsWith('.aac') ||
        orig.endsWith('.opus') ||
        mime.includes('webm') ||
        mime.includes('ogg') ||
        mime.includes('wav');
      const isVideo = !isAudio && (mime.startsWith('video/') || orig.endsWith('.mp4') || orig.endsWith('.mov'));
      const isImage = !isAudio && !isVideo && (mime.startsWith('image/') || isHeicFile(orig, mime));
      if (isAudio) return 'audio';
      if (isVideo) return 'video';
      if (isImage) return 'image';
      return 'file';
    }

    // Link Preview: fetch OpenGraph metadata and thumbnail for URLs
    app.get('/api/link-preview', authMiddleware, async (req, res) => {
      const targetUrl = (req.query.url || '').trim();
      if (!targetUrl) {
        return res.status(400).json({ ok: false, error: 'URL parameter is required.' });
      }
      try {
        const data = await fetchLinkPreview(targetUrl);
        res.json(data);
      } catch (err) {
        res.status(422).json({ ok: false, error: err.message || 'Could not fetch link preview.' });
      }
    });

    // Media: Upload Photo / Video / Audio (Voice Message)
    app.post('/api/upload', authMiddleware, upload.single('media'), async (req, res) => {
      if (!req.file) {
        return res.status(400).json({ ok: false, error: 'No media file provided.' });
      }

      // Auto-convert HEIC/HEIF files to JPEG for full web browser compatibility
      await processUploadedFile(req.file);

      // Persist file into PostgreSQL so redeployments never lose it
      await persistMediaFile(req.file);

      const mediaType = inspectFileMediaType(req.file);
      const url = `${PREFIX}/static/uploads/${req.file.filename}`;

      res.json({
        ok: true,
        url,
        mediaType,
        mediaName: req.file.originalname,
        size: req.file.size,
      });
    });

    // Media: Upload Multiple Photos / Videos / Audio in one go
    app.post('/api/upload-multiple', authMiddleware, upload.array('media', 20), async (req, res) => {
      const files = req.files || [];
      if (!files.length && req.file) files.push(req.file);
      if (!files.length) {
        return res.status(400).json({ ok: false, error: 'No media files provided.' });
      }

      for (const f of files) {
        await processUploadedFile(f);
        await persistMediaFile(f);
      }

      const results = files.map((f) => ({
        url: `${PREFIX}/static/uploads/${f.filename}`,
        mediaType: inspectFileMediaType(f),
        mediaName: f.originalname,
        size: f.size,
      }));

      res.json({ ok: true, files: results });
    });

    // Media: Auto-repair missing media from client cache
    app.post('/api/media/repair', authMiddleware, upload.single('media'), async (req, res) => {
      try {
        const rawFilename = req.body.filename;
        if (!rawFilename || !req.file) {
          return res.status(400).json({ ok: false, error: 'File and filename required.' });
        }

        const filename = path.basename(rawFilename);
        const data = await fs.promises.readFile(req.file.path);
        const destPath = path.join(UPLOADS_DIR, filename);

        // Save to disk cache
        await fs.promises.writeFile(destPath, data);

        // Persist into PostgreSQL
        await pool.query(
          `INSERT INTO chat_media_files (filename, mime_type, data, size)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (filename) DO UPDATE SET data = $3, mime_type = $2, size = $4`,
          [filename, req.file.mimetype || 'image/jpeg', data, data.length]
        );

        // Clean up temporary multer upload file if path differs
        if (req.file.path !== destPath && fs.existsSync(req.file.path)) {
          await fs.promises.unlink(req.file.path).catch(() => {});
        }

        // Broadcast to all connected clients that this media file is now restored!
        if (typeof io !== 'undefined') {
          io.emit('media_restored', {
            filename,
            url: `${PREFIX}/static/uploads/${filename}`,
          });
        }

        console.log(`Media repaired and persisted from client: ${filename} (${data.length} bytes)`);
        res.json({ ok: true, filename });
      } catch (err) {
        console.error('Media repair failed:', err);
        res.status(500).json({ ok: false, error: 'Failed to repair media.' });
      }
    });

    // Messages: Edit (Telegram-style inline message editing)
    app.patch('/api/messages/:id', authMiddleware, async (req, res) => {
      try {
        const msgId = Number(req.params.id);
        const newText = typeof req.body.text === 'string' ? req.body.text.trim() : '';

        if (!newText) {
          return res.status(400).json({ ok: false, error: 'Message text cannot be empty.' });
        }

        const { rows } = await pool.query(
          'SELECT id, conversation_id, sender_id, is_deleted FROM chat_messages WHERE id = $1',
          [msgId]
        );

        if (!rows.length || rows[0].is_deleted) {
          return res.status(404).json({ ok: false, error: 'Message not found.' });
        }

        const msg = rows[0];
        const isOwner = Number(msg.sender_id) === req.user.id;
        if (!isOwner && !req.user.is_admin) {
          return res.status(403).json({ ok: false, error: 'You can only edit your own messages.' });
        }

        await pool.query(
          'UPDATE chat_messages SET body = $1, is_edited = TRUE, edited_at = now() WHERE id = $2',
          [newText, msgId]
        );

        const editedAt = Date.now();
        // Broadcast edit in real time to conversation
        io.to(`c:${msg.conversation_id}`).emit('message_edited', {
          id: msgId,
          conversationId: Number(msg.conversation_id),
          text: newText,
          isEdited: true,
          editedAt,
        });

        res.json({
          ok: true,
          message: {
            id: msgId,
            conversationId: Number(msg.conversation_id),
            text: newText,
            isEdited: true,
            editedAt,
          },
        });
      } catch (err) {
        console.error('Edit message failed:', err);
        res.status(500).json({ ok: false, error: 'Could not edit message.' });
      }
    });

    // Messages: Delete (Telegram-style: gone without a trace)
    app.delete('/api/messages/:id', authMiddleware, async (req, res) => {
      try {
        const msgId = Number(req.params.id);
        const { rows } = await pool.query(
          'SELECT id, conversation_id, sender_id, media_url, media_list FROM chat_messages WHERE id = $1',
          [msgId]
        );

        if (!rows.length) {
          return res.status(404).json({ ok: false, error: 'Message not found.' });
        }

        const msg = rows[0];
        const isOwner = Number(msg.sender_id) === req.user.id;
        if (!isOwner && !req.user.is_admin) {
          return res.status(403).json({ ok: false, error: 'You can only delete your own messages.' });
        }

        // Like Telegram: remove media files if present
        const filesToDelete = [];
        if (msg.media_url) filesToDelete.push(msg.media_url);
        if (msg.media_list) {
          try {
            const list = typeof msg.media_list === 'string' ? JSON.parse(msg.media_list) : msg.media_list;
            if (Array.isArray(list)) {
              list.forEach((m) => { if (m && m.url) filesToDelete.push(m.url); });
            }
          } catch {}
        }

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

        // Hard delete - completely removed from database
        await pool.query('DELETE FROM chat_messages WHERE id = $1', [msgId]);

        // Broadcast deletion in real time to conversation
        io.to(`c:${msg.conversation_id}`).emit('message_deleted', {
          id: msgId,
          conversationId: Number(msg.conversation_id),
        });

        res.json({ ok: true, id: msgId });
      } catch (err) {
        console.error('Delete message failed:', err);
        res.status(500).json({ ok: false, error: 'Could not delete message.' });
      }
    });

    // Messages: React / Toggle emoji reaction
    app.post('/api/messages/:id/react', authMiddleware, async (req, res) => {
      try {
        const msgId = Number(req.params.id);
        const emoji = String((req.body && req.body.emoji) || '').trim();

        if (!msgId || !emoji) {
          return res.status(400).json({ ok: false, error: 'Invalid message or emoji.' });
        }

        const { rows } = await pool.query(
          'SELECT id, conversation_id, is_deleted FROM chat_messages WHERE id = $1',
          [msgId]
        );
        if (!rows.length || rows[0].is_deleted) {
          return res.status(404).json({ ok: false, error: 'Message not found.' });
        }

        const convId = Number(rows[0].conversation_id);
        const memberCheck = await pool.query(
          'SELECT 1 FROM chat_conversation_members WHERE conversation_id = $1 AND user_id = $2',
          [convId, req.user.id]
        );
        if (!memberCheck.rows.length) {
          return res.status(403).json({ ok: false, error: 'You are not a member of this conversation.' });
        }

        const existing = await pool.query(
          'SELECT id, emoji FROM chat_message_reactions WHERE message_id = $1 AND user_id = $2',
          [msgId, req.user.id]
        );

        if (existing.rows.length) {
          if (existing.rows[0].emoji === emoji) {
            // Toggle off
            await pool.query(
              'DELETE FROM chat_message_reactions WHERE message_id = $1 AND user_id = $2',
              [msgId, req.user.id]
            );
          } else {
            // Switch emoji
            await pool.query(
              'UPDATE chat_message_reactions SET emoji = $1, created_at = now() WHERE message_id = $2 AND user_id = $3',
              [emoji, msgId, req.user.id]
            );
          }
        } else {
          await pool.query(
            'INSERT INTO chat_message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3)',
            [msgId, req.user.id, emoji]
          );
        }

        const reactionsMap = await getMessagesReactions([msgId]);
        const updatedReactions = reactionsMap[msgId] || [];

        if (typeof io !== 'undefined') {
          io.to(`c:${convId}`).emit('message_reaction_updated', {
            messageId: msgId,
            conversationId: convId,
            userId: req.user.id,
            reactions: updatedReactions,
          });
        }

        res.json({ ok: true, messageId: msgId, reactions: updatedReactions });
      } catch (err) {
        console.error('React message failed:', err);
        res.status(500).json({ ok: false, error: 'Failed to update reaction.' });
      }
    });
};
