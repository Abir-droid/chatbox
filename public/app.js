(() => {
  'use strict';

  // Read subpath from <meta name="app-base">
  const metaBase = document.querySelector('meta[name="app-base"]');
  const BASE = ((metaBase && metaBase.content) || '').replace(/\/+$/, '');

  const $ = (id) => document.getElementById(id);

  const el = {
    appLoader: $('app-loader'),
    loaderStatus: $('loader-status'),
    authScreen: $('auth-screen'),
    authForm: $('auth-form'),
    tabLogin: $('tab-login'),
    tabRegister: $('tab-register'),
    nameField: $('name-field'),
    authName: $('auth-name'),
    authPhone: $('auth-phone'),
    authPassword: $('auth-password'),
    togglePwBtn: $('toggle-pw-btn'),
    pwEye: $('pw-eye'),
    pwEyeOff: $('pw-eye-off'),
    authError: $('auth-error'),
    authSubmit: $('auth-submit'),

    app: $('app'),
    rail: $('rail'),
    scrim: $('scrim'),
    menuBtn: $('menu-btn'),
    railSearchInput: $('rail-search-input'),

    navChats: $('nav-chats'),
    navFriends: $('nav-friends'),
    navAdmin: $('nav-admin'),
    panelChats: $('panel-chats'),
    panelFriends: $('panel-friends'),
    newChatBtn: $('new-chat-btn'),
    chatList: $('chat-list'),
    friendList: $('friend-list'),
    addFriendBtn: $('add-friend-btn'),

    meAvatar: $('me-avatar'),
    meName: $('me-name'),
    mePhone: $('me-phone'),
    notifBtn: $('notif-btn'),
    themeBtn: $('theme-btn'),
    iconMoon: $('icon-moon'),
    iconSun: $('icon-sun'),
    logoutBtn: $('logout-btn'),

    threadHead: $('thread-head'),
    convAvatar: $('conv-avatar'),
    convTitle: $('conv-title'),
    convSub: $('conv-sub'),
    manageGroupBtn: $('manage-group-btn'),

    banner: $('banner'),
    log: $('log'),
    emptyState: $('empty-state'),
    emptyTitle: $('empty-title'),
    emptyText: $('empty-text'),
    messages: $('messages'),
    jump: $('jump'),
    jumpText: $('jump-text'),
    typing: $('typing'),

    composer: $('composer'),
    input: $('input'),
    send: $('send'),
    attachBtn: $('attach-btn'),
    mediaInput: $('media-input'),
    mediaPreviewBar: $('media-preview-bar'),
    mediaThumb: $('media-thumb'),
    mediaName: $('media-name'),
    mediaSize: $('media-size'),
    mediaCancel: $('media-cancel'),

    emojiBtn: $('emoji-btn'),
    emojiPicker: $('emoji-picker'),

    newChatDialog: $('new-chat-dialog'),
    tabNewDm: $('tab-new-dm'),
    tabNewGroup: $('tab-new-group'),
    dmForm: $('dm-form'),
    dmPhone: $('dm-phone'),
    dmError: $('dm-error'),
    groupForm: $('group-form'),
    groupName: $('group-name'),
    groupMembers: $('group-members'),
    groupError: $('group-error'),

    addFriendDialog: $('add-friend-dialog'),
    friendForm: $('friend-form'),
    friendPhone: $('friend-phone'),
    friendError: $('friend-error'),

    groupMembersDialog: $('group-members-dialog'),
    addMemberForm: $('add-member-form'),
    newMemberPhone: $('new-member-phone'),
    addMemberError: $('add-member-error'),
    membersList: $('members-list'),

    lightboxDialog: $('lightbox-dialog'),
    lightboxImg: $('lightbox-img'),
    lightboxClose: $('lightbox-close'),

    adminDialog: $('admin-dialog'),
    statUsers: $('stat-users'),
    statOnline: $('stat-online'),
    statMessages: $('stat-messages'),
    statDeleted: $('stat-deleted'),
    adminTabUsers: $('admin-tab-users'),
    adminTabChats: $('admin-tab-chats'),
    adminViewUsers: $('admin-view-users'),
    adminViewChats: $('admin-view-chats'),
    adminUsersTbody: $('admin-users-tbody'),
    auditConvList: $('audit-conv-list'),
    auditThreadHeader: $('audit-thread-header'),
    auditMessages: $('audit-messages'),

    toasts: $('toasts'),
  };

  const state = {
    token: localStorage.getItem('chatbox_token') || '',
    user: null,
    conversations: [],
    friends: [],
    activeConversationId: null,
    selectedFile: null,
    typers: new Map(),
    notificationsEnabled: Notification && Notification.permission === 'granted',
  };

  let socket = null;

  /* ------------------------------------------------------------- app loader */
  function setLoaderStatus(text) {
    if (el.loaderStatus) el.loaderStatus.textContent = text;
  }

  function hideLoader() {
    if (!el.appLoader) return;
    el.appLoader.classList.add('fade-out');
    setTimeout(() => {
      el.appLoader.hidden = true;
    }, 400);
  }

  /* ----------------------------------------------------------------- sound */
  function playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      /* AudioContext not allowed or not supported */
    }
  }

  /* ------------------------------------------------------------- notifications */
  function sendBrowserNotification(title, body, convId) {
    if (!state.notificationsEnabled || !('Notification' in window)) return;
    try {
      const notif = new Notification(title, {
        body,
        icon: `${BASE}/static/favicon.svg`,
        tag: `chatbox-${convId}`,
      });
      notif.onclick = () => {
        window.focus();
        if (convId) switchConversation(convId);
        notif.close();
      };
    } catch (e) {
      /* notification blocked */
    }
  }

  function toggleNotificationPermission() {
    if (!('Notification' in window)) {
      toast('Notifications are not supported in this browser.');
      return;
    }
    if (Notification.permission === 'granted') {
      toast('Notifications are already enabled.');
      return;
    }
    Notification.requestPermission().then((perm) => {
      state.notificationsEnabled = perm === 'granted';
      if (perm === 'granted') {
        toast('Browser notifications enabled!');
      } else {
        toast('Notification permission was not granted.');
      }
    });
  }

  /* ------------------------------------------------------------- toast utility */
  function toast(text) {
    const node = document.createElement('div');
    node.className = 'toast';
    node.textContent = text;
    el.toasts.appendChild(node);
    setTimeout(() => node.remove(), 4000);
    while (el.toasts.children.length > 4) el.toasts.firstChild.remove();
  }

  function api(endpoint, options = {}) {
    options.headers = options.headers || {};
    if (state.token) {
      options.headers['Authorization'] = `Bearer ${state.token}`;
    }
    return fetch(`${BASE}${endpoint}`, options).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }
      return data;
    });
  }

  /* ----------------------------------------------------------------- auth UI */
  let isRegisterMode = false;

  function setAuthMode(register) {
    isRegisterMode = register;
    el.tabLogin.classList.toggle('active', !register);
    el.tabRegister.classList.toggle('active', register);
    el.nameField.hidden = !register;
    el.authName.required = register;
    el.authSubmit.textContent = register ? 'Create Account' : 'Sign In';
    el.authError.hidden = true;
    if (register) el.authName.focus();
    else el.authPhone.focus();
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    el.authError.hidden = true;

    const phone = el.authPhone.value.trim();
    const password = el.authPassword.value;
    const name = el.authName.value.trim();

    el.authSubmit.disabled = true;
    el.authSubmit.textContent = isRegisterMode ? 'Creating account…' : 'Signing in…';

    try {
      let data;
      if (isRegisterMode) {
        data = await api('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, password }),
        });
        toast('Account created successfully!');
      } else {
        data = await api('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, password }),
        });
        toast(`Welcome back, ${data.user.name}!`);
      }

      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('chatbox_token', data.token);

      el.authPassword.value = '';
      onLoginSuccess();
    } catch (err) {
      el.authError.textContent = err.message;
      el.authError.hidden = false;
    } finally {
      el.authSubmit.disabled = false;
      el.authSubmit.textContent = isRegisterMode ? 'Create Account' : 'Sign In';
    }
  }

  function logout() {
    state.token = '';
    state.user = null;
    localStorage.removeItem('chatbox_token');
    if (socket) socket.disconnect();
    el.app.hidden = true;
    el.authScreen.hidden = false;
    setAuthMode(false);
  }

  async function checkInitialAuth() {
    if (!state.token) {
      el.authScreen.hidden = false;
      el.app.hidden = true;
      hideLoader();
      return;
    }
    try {
      setLoaderStatus('Verifying session…');
      const data = await api('/api/auth/me');
      state.user = data.user;
      onLoginSuccess();
    } catch (err) {
      logout();
    } finally {
      hideLoader();
    }
  }

  function onLoginSuccess() {
    el.authScreen.hidden = true;
    el.app.hidden = false;

    el.meName.textContent = state.user.name;
    el.mePhone.textContent = state.user.phone;
    el.meAvatar.textContent = state.user.name[0].toUpperCase();
    el.meAvatar.className = `avatar c-${state.user.avatar_color || 0}`;

    el.navAdmin.hidden = !state.user.is_admin;

    initSocket();
    loadConversations();
    loadFriends();
    hideLoader();

    if (window.innerWidth <= 768 && !state.activeConversationId) {
      openRail();
    }
  }

  /* ------------------------------------------------------------- socket */
  function initSocket() {
    if (socket) socket.disconnect();

    socket = io({
      path: `${BASE}/socket.io`,
      auth: { token: state.token },
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      el.banner.hidden = true;
      if (state.activeConversationId) {
        socket.emit('join_conversation', { conversationId: state.activeConversationId });
      }
    });

    socket.on('disconnect', () => {
      el.banner.textContent = 'Connection lost. Reconnecting…';
      el.banner.hidden = false;
    });

    socket.on('account_suspended', () => {
      toast('Your account has been suspended by an administrator.');
      logout();
    });

    socket.on('user_status', ({ userId, isOnline }) => {
      // Update online status in friends & conversations
      for (const conv of state.conversations) {
        if (conv.otherUserId === userId) {
          conv.isOnline = isOnline;
        }
      }
      for (const f of state.friends) {
        if (f.id === userId) {
          f.isOnline = isOnline;
        }
      }
      renderConversations();
      renderFriends();
      if (state.activeConversationId) {
        const active = state.conversations.find((c) => c.id === state.activeConversationId);
        if (active && active.type === 'direct' && active.otherUserId === userId) {
          el.convSub.textContent = `${active.phone} • ${isOnline ? 'Online' : 'Offline'}`;
        }
      }
    });

    socket.on('message', (msg) => {
      const isCurrent = state.activeConversationId === msg.conversationId;
      if (isCurrent) {
        appendMessage(msg);
        scrollToBottom();
      }

      // Update sidebar preview
      const conv = state.conversations.find((c) => c.id === msg.conversationId);
      if (conv) {
        conv.lastMessage = {
          text: msg.mediaType ? `[${msg.mediaType}]` : msg.text,
          senderName: msg.senderName,
          ts: msg.ts,
        };
        renderConversations();
      }

      // Audio & Desktop notification if from someone else
      if (msg.senderId !== state.user.id) {
        playChime();
        const title = conv ? (conv.type === 'group' ? `${conv.name} (${msg.senderName})` : msg.senderName) : msg.senderName;
        const bodyText = msg.mediaType ? (msg.mediaType === 'image' ? '📷 Sent a photo' : '🎥 Sent a video') : msg.text;
        if (document.hidden || !isCurrent) {
          sendBrowserNotification(title, bodyText, msg.conversationId);
        }
      }
    });

    socket.on('message_deleted', ({ id, conversationId }) => {
      if (state.activeConversationId === conversationId) {
        const bubble = $(`msg-bubble-${id}`);
        if (bubble) {
          bubble.className = 'bubble deleted';
          bubble.textContent = 'This message was deleted';
        }
      }
    });

    socket.on('typing', ({ conversationId, userId, userName, typing }) => {
      if (state.activeConversationId === conversationId && userId !== state.user.id) {
        if (typing) {
          state.typers.set(userId, userName);
        } else {
          state.typers.delete(userId);
        }
        renderTyping();
      }
    });

    socket.on('conversation_created', () => {
      loadConversations();
    });

    socket.on('conversation_added', ({ conversationId }) => {
      loadConversations();
      toast('You were added to a new conversation!');
    });
  }

  let searchTerm = '';

  function renderTyping() {
    const names = [...state.typers.values()];
    if (!names.length) {
      el.typing.replaceChildren();
      return;
    }
    const labelText = names.length === 1 ? `${names[0]} is typing…` : 'Multiple people are typing…';
    el.typing.innerHTML = `
      <div class="typing-bubble">
        <div class="typing-dots" aria-hidden="true">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
        <span class="typing-label">${labelText}</span>
      </div>
    `;
  }

  /* ------------------------------------------------------- conversations & chats */
  async function loadConversations() {
    try {
      const data = await api('/api/conversations');
      state.conversations = data.conversations || [];
      renderConversations();
    } catch (err) {
      console.error('Load conversations error:', err);
    }
  }

  function renderConversations() {
    el.chatList.replaceChildren();
    const list = searchTerm
      ? state.conversations.filter(
          (c) =>
            (c.name && c.name.toLowerCase().includes(searchTerm)) ||
            (c.phone && c.phone.includes(searchTerm)) ||
            (c.lastMessage && c.lastMessage.text && c.lastMessage.text.toLowerCase().includes(searchTerm))
        )
      : state.conversations;

    if (!list.length) {
      const empty = document.createElement('li');
      empty.className = 'panel-title';
      empty.style.padding = '1.25rem 0.75rem';
      empty.style.textAlign = 'center';
      empty.textContent = searchTerm ? 'No matching conversations' : 'No chats yet. Click + above!';
      el.chatList.appendChild(empty);
      return;
    }

    for (const conv of list) {
      const li = document.createElement('li');
      li.className = `chat-item ${state.activeConversationId === conv.id ? 'active' : ''}`;
      li.onclick = () => switchConversation(conv.id);

      const avatar = document.createElement('span');
      avatar.className = `avatar c-${conv.avatarColor || 0} ${conv.isOnline ? 'online' : ''}`;
      avatar.textContent = conv.type === 'group' ? '👥' : (conv.name[0] || '?').toUpperCase();

      const textDiv = document.createElement('div');
      textDiv.className = 'chat-item-text';

      const topDiv = document.createElement('div');
      topDiv.className = 'chat-item-top';

      const name = document.createElement('span');
      name.className = 'chat-item-name';
      name.textContent = conv.name;

      const time = document.createElement('span');
      time.className = 'chat-item-time';
      time.textContent = conv.lastMessage ? formatShortTime(conv.lastMessage.ts) : '';

      topDiv.append(name, time);

      const snippet = document.createElement('div');
      snippet.className = 'chat-item-snippet';
      if (conv.lastMessage) {
        snippet.textContent = `${conv.lastMessage.senderName}: ${conv.lastMessage.text}`;
      } else {
        snippet.textContent = conv.type === 'group' ? `${conv.memberCount} members` : conv.phone;
      }

      textDiv.append(topDiv, snippet);
      li.append(avatar, textDiv);
      el.chatList.appendChild(li);
    }
  }

  async function switchConversation(convId) {
    state.activeConversationId = convId;
    closeRail();
    updateMenuButton(true);
    state.typers.clear();
    renderTyping();

    const conv = state.conversations.find((c) => c.id === convId);
    if (!conv) return;

    renderConversations();

    // Setup Header
    el.convTitle.textContent = conv.name;
    el.convAvatar.textContent = conv.type === 'group' ? '👥' : (conv.name[0] || '?').toUpperCase();
    el.convAvatar.className = `avatar c-${conv.avatarColor || 0} ${conv.isOnline ? 'online' : ''}`;

    if (conv.type === 'group') {
      el.convSub.textContent = `${conv.memberCount} members`;
      el.manageGroupBtn.hidden = false;
    } else {
      el.convSub.textContent = `${conv.phone} • ${conv.isOnline ? 'Online' : 'Offline'}`;
      el.manageGroupBtn.hidden = true;
    }

    el.input.disabled = false;
    el.send.disabled = false;
    el.input.placeholder = `Message ${conv.name}…`;

    // Join room on socket
    if (socket) {
      socket.emit('join_conversation', { conversationId: convId });
    }

    // Load message history
    try {
      const data = await api(`/api/conversations/${convId}/messages`);
      renderMessages(data.messages || []);
    } catch (err) {
      toast(err.message);
    }
  }

  function renderMessages(messages) {
    el.messages.replaceChildren();
    if (!messages.length) {
      el.emptyState.hidden = false;
      el.emptyTitle.textContent = 'No messages yet';
      el.emptyText.textContent = 'Say hello to start the conversation!';
    } else {
      el.emptyState.hidden = true;
      for (const msg of messages) {
        appendMessage(msg);
      }
      scrollToBottom();
    }
  }

  function appendMessage(msg) {
    el.emptyState.hidden = true;

    const isOwn = msg.senderId === state.user.id;
    const isSystem = msg.senderName === 'System';

    const li = document.createElement('li');
    li.className = `msg-row ${isOwn ? 'own' : ''} ${isSystem ? 'system' : ''}`;
    li.id = `msg-${msg.id}`;

    if (isSystem) {
      const bubble = document.createElement('div');
      bubble.className = 'system-bubble';
      bubble.textContent = msg.text;
      li.appendChild(bubble);
      el.messages.appendChild(li);
      return;
    }

    // Avatar for other user
    if (!isOwn) {
      const avatar = document.createElement('span');
      avatar.className = 'avatar';
      avatar.style.width = '30px';
      avatar.style.height = '30px';
      avatar.style.fontSize = '0.78rem';
      avatar.textContent = (msg.senderName[0] || '?').toUpperCase();
      li.appendChild(avatar);
    }

    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'msg-body';

    const meta = document.createElement('div');
    meta.className = 'msg-meta';
    
    const timeSpan = document.createElement('span');
    timeSpan.textContent = `${isOwn ? 'You' : msg.senderName} • ${formatShortTime(msg.ts)}`;
    meta.appendChild(timeSpan);

    if (isOwn) {
      const checkSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      checkSvg.setAttribute('class', 'msg-check');
      checkSvg.setAttribute('viewBox', '0 0 16 16');
      checkSvg.setAttribute('aria-hidden', 'true');
      checkSvg.innerHTML = '<path d="M12.3 4.3a1 1 0 0 0-1.4 0L6 9.2 4.1 7.3a1 1 0 1 0-1.4 1.4l2.6 2.6a1 1 0 0 0 1.4 0l5.6-5.6a1 1 0 0 0 0-1.4z"/>';
      meta.appendChild(checkSvg);
    }

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.id = `msg-bubble-${msg.id}`;

    if (msg.text) {
      const p = document.createElement('p');
      p.textContent = msg.text;
      bubble.appendChild(p);
    }

    // Media (Photo or Video)
    if (msg.mediaUrl) {
      const mediaDiv = document.createElement('div');
      mediaDiv.className = 'msg-media';

      if (msg.mediaType === 'image') {
        const img = document.createElement('img');
        img.src = msg.mediaUrl;
        img.alt = msg.mediaName || 'Photo';
        img.loading = 'lazy';
        img.onclick = () => openLightbox(msg.mediaUrl);
        mediaDiv.appendChild(img);
      } else if (msg.mediaType === 'video') {
        const video = document.createElement('video');
        video.src = msg.mediaUrl;
        video.controls = true;
        video.preload = 'metadata';
        mediaDiv.appendChild(video);
      }
      bubble.appendChild(mediaDiv);
    }

    bodyDiv.append(meta, bubble);

    // Actions toolbar (Copy & Delete)
    const actions = document.createElement('div');
    actions.className = 'msg-actions';

    if (msg.text) {
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'action-btn';
      copyBtn.title = 'Copy message';
      copyBtn.innerHTML = '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
      copyBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(msg.text);
          toast('Copied message to clipboard');
        } catch {
          toast('Failed to copy');
        }
      };
      actions.appendChild(copyBtn);
    }

    if (isOwn || (state.user && state.user.is_admin)) {
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'action-btn del-btn';
      delBtn.title = 'Delete message';
      delBtn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
      delBtn.onclick = () => deleteMessage(msg.id);
      actions.appendChild(delBtn);
    }

    if (actions.children.length > 0) {
      li.appendChild(actions);

      // Mobile / Touchscreen tap to show action toolbar
      li.addEventListener('click', (e) => {
        if (e.target.closest('.action-btn') || e.target.closest('img') || e.target.closest('video')) return;
        document.querySelectorAll('.msg-row.show-actions').forEach((r) => {
          if (r !== li) r.classList.remove('show-actions');
        });
        li.classList.toggle('show-actions');
      });
    }

    li.appendChild(bodyDiv);
    el.messages.appendChild(li);
  }

  async function deleteMessage(msgId) {
    if (!confirm('Delete this message?')) return;
    try {
      await api(`/api/messages/${msgId}`, { method: 'DELETE' });
      const bubble = $(`msg-bubble-${msgId}`);
      if (bubble) {
        bubble.className = 'bubble deleted';
        bubble.textContent = 'This message was deleted';
      }
    } catch (err) {
      toast(err.message);
    }
  }

  function scrollToBottom() {
    el.log.scrollTop = el.log.scrollHeight;
  }

  function formatShortTime(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /* ------------------------------------------------------------- media upload */
  el.attachBtn.onclick = () => el.mediaInput.click();

  el.mediaInput.onchange = () => {
    const file = el.mediaInput.files && el.mediaInput.files[0];
    if (!file) return;

    state.selectedFile = file;
    el.mediaName.textContent = file.name;
    el.mediaSize.textContent = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      el.mediaThumb.style.backgroundImage = `url(${url})`;
    } else {
      el.mediaThumb.style.backgroundImage = 'none';
      el.mediaThumb.textContent = '🎥';
    }

    el.mediaPreviewBar.hidden = false;
    el.input.focus();
  };

  el.mediaCancel.onclick = clearMediaSelection;

  function clearMediaSelection() {
    state.selectedFile = null;
    el.mediaInput.value = '';
    el.mediaPreviewBar.hidden = true;
  }

  function openLightbox(url) {
    el.lightboxImg.src = url;
    el.lightboxDialog.showModal();
  }

  el.lightboxClose.onclick = () => el.lightboxDialog.close();

  /* ------------------------------------------------------------- sending */
  el.composer.onsubmit = async (e) => {
    e.preventDefault();
    if (!state.activeConversationId) return;

    const text = el.input.value.trim();
    if (!text && !state.selectedFile) return;

    let mediaUrl = null;
    let mediaType = null;
    let mediaName = null;

    el.send.disabled = true;

    try {
      if (state.selectedFile) {
        toast('Uploading media…');
        const fd = new FormData();
        fd.append('media', state.selectedFile);

        const uploadRes = await fetch(`${BASE}/api/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${state.token}` },
          body: fd,
        });

        const data = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(data.error || 'Media upload failed');

        mediaUrl = data.url;
        mediaType = data.mediaType;
        mediaName = data.mediaName;
      }

      socket.emit('message', {
        conversationId: state.activeConversationId,
        text,
        mediaUrl,
        mediaType,
        mediaName,
      });

      el.input.value = '';
      clearMediaSelection();
    } catch (err) {
      toast(err.message);
    } finally {
      el.send.disabled = false;
      el.input.focus();
    }
  };

  // Typing indicator broadcast
  let typingTimer = null;
  el.input.oninput = () => {
    if (!state.activeConversationId || !socket) return;
    socket.emit('typing', { conversationId: state.activeConversationId, typing: true });
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      socket.emit('typing', { conversationId: state.activeConversationId, typing: false });
    }, 2000);
  };

  /* ------------------------------------------------------------- emoji picker */
  const EMOJIS = [
    '😀','😂','🤣','😊','😍','🥰','😘','😜','😎','🥳','🤔','🤫','😴','😭','😡','🤯',
    '👍','👎','👏','🙌','🤝','✌️','🤞','🫡','🙏','💪','👊','🔥','✨','❤️','💔','💯',
    '🎉','🎂','🍻','☕','🍕','🍔','🚀','💻','📱','🎵','🎮','⭐','✅','❌','⚠️','👋'
  ];

  function initEmojiPicker() {
    el.emojiPicker.replaceChildren();
    for (const emoji of EMOJIS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'emoji-btn-item';
      btn.textContent = emoji;
      btn.onclick = () => {
        el.input.value += emoji;
        el.emojiPicker.hidden = true;
        el.input.focus();
      };
      el.emojiPicker.appendChild(btn);
    }
  }

  el.emojiBtn.onclick = (e) => {
    e.stopPropagation();
    el.emojiPicker.hidden = !el.emojiPicker.hidden;
  };

  document.addEventListener('click', (e) => {
    if (!el.emojiPicker.contains(e.target) && e.target !== el.emojiBtn) {
      el.emojiPicker.hidden = true;
    }
  });

  /* ------------------------------------------------------------- friends */
  async function loadFriends() {
    try {
      const data = await api('/api/friends');
      state.friends = data.friends || [];
      renderFriends();
    } catch (err) {
      console.error('Load friends error:', err);
    }
  }

  function renderFriends() {
    el.friendList.replaceChildren();
    const list = searchTerm
      ? state.friends.filter(
          (f) =>
            (f.name && f.name.toLowerCase().includes(searchTerm)) ||
            (f.phone && f.phone.includes(searchTerm))
        )
      : state.friends;

    if (!list.length) {
      const empty = document.createElement('li');
      empty.className = 'panel-title';
      empty.style.padding = '1.25rem 0.75rem';
      empty.style.textAlign = 'center';
      empty.textContent = searchTerm ? 'No matching friends' : 'No friends added yet. Click + Add!';
      el.friendList.appendChild(empty);
      return;
    }

    for (const f of list) {
      const li = document.createElement('li');
      li.className = 'friend-item';
      li.onclick = () => startDirectChatWithPhone(f.phone);

      const avatar = document.createElement('span');
      avatar.className = `avatar c-${f.avatarColor || 0} ${f.isOnline ? 'online' : ''}`;
      avatar.textContent = (f.name[0] || '?').toUpperCase();

      const textDiv = document.createElement('div');
      textDiv.className = 'friend-item-text';

      const topDiv = document.createElement('div');
      topDiv.className = 'friend-item-top';

      const name = document.createElement('span');
      name.className = 'friend-item-name';
      name.textContent = f.name;

      topDiv.appendChild(name);

      const sub = document.createElement('div');
      sub.className = 'friend-item-sub';
      sub.textContent = `${f.phone} • ${f.isOnline ? 'Online' : 'Offline'}`;

      textDiv.append(topDiv, sub);
      li.append(avatar, textDiv);
      el.friendList.appendChild(li);
    }
  }

  async function startDirectChatWithPhone(phone) {
    try {
      const data = await api('/api/conversations/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      await loadConversations();
      switchConversation(data.conversation.id);
    } catch (err) {
      toast(err.message);
    }
  }

  /* ------------------------------------------------------------- navigation */
  el.navChats.onclick = () => {
    el.navChats.classList.add('active');
    el.navFriends.classList.remove('active');
    el.panelChats.hidden = false;
    el.panelFriends.hidden = true;
  };

  el.navFriends.onclick = () => {
    el.navFriends.classList.add('active');
    el.navChats.classList.remove('active');
    el.panelFriends.hidden = false;
    el.panelChats.hidden = true;
  };

  el.newChatBtn.onclick = () => {
    el.dmError.textContent = '';
    el.groupError.textContent = '';
    el.newChatDialog.showModal();
  };

  el.tabNewDm.onclick = () => {
    el.tabNewDm.classList.add('active');
    el.tabNewGroup.classList.remove('active');
    el.dmForm.hidden = false;
    el.groupForm.hidden = true;
  };

  el.tabNewGroup.onclick = () => {
    el.tabNewGroup.classList.add('active');
    el.tabNewDm.classList.remove('active');
    el.groupForm.hidden = false;
    el.dmForm.hidden = true;
  };

  el.dmForm.onsubmit = async (e) => {
    e.preventDefault();
    el.dmError.textContent = '';
    try {
      const phone = el.dmPhone.value.trim();
      const data = await api('/api/conversations/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      el.dmPhone.value = '';
      el.newChatDialog.close();
      await loadConversations();
      switchConversation(data.conversation.id);
    } catch (err) {
      el.dmError.textContent = err.message;
    }
  };

  el.groupForm.onsubmit = async (e) => {
    e.preventDefault();
    el.groupError.textContent = '';
    try {
      const name = el.groupName.value.trim();
      const phones = el.groupMembers.value
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const data = await api('/api/conversations/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phones }),
      });

      el.groupName.value = '';
      el.groupMembers.value = '';
      el.newChatDialog.close();
      await loadConversations();
      switchConversation(data.conversation.id);
    } catch (err) {
      el.groupError.textContent = err.message;
    }
  };

  el.addFriendBtn.onclick = () => {
    el.friendError.textContent = '';
    el.addFriendDialog.showModal();
  };

  el.friendForm.onsubmit = async (e) => {
    e.preventDefault();
    el.friendError.textContent = '';
    try {
      const phone = el.friendPhone.value.trim();
      await api('/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      el.friendPhone.value = '';
      el.addFriendDialog.close();
      toast('Friend added!');
      loadFriends();
    } catch (err) {
      el.friendError.textContent = err.message;
    }
  };

  // Group Members modal
  el.manageGroupBtn.onclick = async () => {
    if (!state.activeConversationId) return;
    el.addMemberError.textContent = '';
    el.groupMembersDialog.showModal();
    loadGroupMembers();
  };

  async function loadGroupMembers() {
    try {
      const data = await api(`/api/conversations/${state.activeConversationId}/members`);
      el.membersList.replaceChildren();
      for (const m of data.members || []) {
        const li = document.createElement('li');
        li.className = 'member-item';

        const left = document.createElement('div');
        left.className = 'member-item-left';

        const avatar = document.createElement('span');
        avatar.className = `avatar c-${m.avatarColor || 0} ${m.isOnline ? 'online' : ''}`;
        avatar.style.width = '32px';
        avatar.style.height = '32px';
        avatar.style.fontSize = '0.8rem';
        avatar.textContent = (m.name[0] || '?').toUpperCase();

        const info = document.createElement('div');
        info.innerHTML = `<strong>${m.name}</strong> <span style="font-size:0.78rem;color:var(--muted)">(${m.phone})</span>`;

        left.append(avatar, info);

        const badge = document.createElement('span');
        badge.className = 'role-badge';
        badge.textContent = m.role;

        li.append(left, badge);
        el.membersList.appendChild(li);
      }
    } catch (err) {
      toast(err.message);
    }
  }

  el.addMemberForm.onsubmit = async (e) => {
    e.preventDefault();
    el.addMemberError.textContent = '';
    try {
      const phone = el.newMemberPhone.value.trim();
      await api(`/api/conversations/${state.activeConversationId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      el.newMemberPhone.value = '';
      toast('Member added!');
      loadGroupMembers();
      loadConversations();
    } catch (err) {
      el.addMemberError.textContent = err.message;
    }
  };

  // Close modals
  document.querySelectorAll('.close-dialog').forEach((btn) => {
    btn.onclick = () => {
      const id = btn.dataset.dialog;
      if (id && $(id)) $(id).close();
    };
  });

  /* ------------------------------------------------------------- admin dashboard */
  el.navAdmin.onclick = () => {
    el.adminDialog.showModal();
    loadAdminStats();
    loadAdminUsers();
  };

  el.adminTabUsers.onclick = () => {
    el.adminTabUsers.classList.add('active');
    el.adminTabChats.classList.remove('active');
    el.adminViewUsers.hidden = false;
    el.adminViewChats.hidden = true;
    loadAdminUsers();
  };

  el.adminTabChats.onclick = () => {
    el.adminTabChats.classList.add('active');
    el.adminTabUsers.classList.remove('active');
    el.adminViewChats.hidden = false;
    el.adminViewUsers.hidden = true;
    loadAdminConversations();
  };

  async function loadAdminStats() {
    try {
      const data = await api('/api/admin/stats');
      el.statUsers.textContent = data.stats.totalUsers;
      el.statOnline.textContent = data.stats.activeUsersOnline;
      el.statMessages.textContent = data.stats.totalMessages;
      el.statDeleted.textContent = data.stats.deletedMessages;
    } catch (err) {
      console.error('Admin stats error:', err);
    }
  }

  async function loadAdminUsers() {
    try {
      const data = await api('/api/admin/users');
      el.adminUsersTbody.replaceChildren();

      for (const u of data.users || []) {
        const tr = document.createElement('tr');

        const tdName = document.createElement('td');
        tdName.innerHTML = `<strong>${u.name}</strong>`;

        const tdPhone = document.createElement('td');
        tdPhone.textContent = u.phone;

        const tdMsgs = document.createElement('td');
        tdMsgs.textContent = u.messageCount;

        const tdRole = document.createElement('td');
        tdRole.textContent = u.isAdmin ? 'Admin' : 'User';

        const tdStatus = document.createElement('td');
        tdStatus.innerHTML = `<span class="status-badge ${u.isSuspended ? 'suspended' : 'active'}">${
          u.isSuspended ? 'Suspended' : 'Active'
        }</span>`;

        const tdAction = document.createElement('td');
        if (u.id !== state.user.id) {
          const btn = document.createElement('button');
          btn.className = `btn-suspend ${u.isSuspended ? 'unsuspend' : ''}`;
          btn.textContent = u.isSuspended ? 'Unblock' : 'Block';
          btn.onclick = () => toggleSuspendUser(u.id, !u.isSuspended);
          tdAction.appendChild(btn);
        } else {
          tdAction.textContent = '(You)';
        }

        tr.append(tdName, tdPhone, tdMsgs, tdRole, tdStatus, tdAction);
        el.adminUsersTbody.appendChild(tr);
      }
    } catch (err) {
      toast(err.message);
    }
  }

  async function toggleSuspendUser(userId, suspend) {
    try {
      await api(`/api/admin/users/${userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suspend }),
      });
      toast(`User ${suspend ? 'blocked' : 'unblocked'}`);
      loadAdminUsers();
      loadAdminStats();
    } catch (err) {
      toast(err.message);
    }
  }

  async function loadAdminConversations() {
    try {
      const data = await api('/api/admin/conversations');
      el.auditConvList.replaceChildren();

      for (const conv of data.conversations || []) {
        const li = document.createElement('li');
        li.className = 'audit-conv-item';
        li.innerHTML = `<strong>${conv.name}</strong> <span style="font-size:0.75rem;color:var(--muted)">(${conv.type}, ${conv.totalMessages} msgs)</span>`;
        li.onclick = () => loadConversationAuditLog(conv);
        el.auditConvList.appendChild(li);
      }
    } catch (err) {
      toast(err.message);
    }
  }

  async function loadConversationAuditLog(conv) {
    document.querySelectorAll('.audit-conv-item').forEach((i) => i.classList.remove('active'));
    el.auditThreadHeader.textContent = `Auditing: ${conv.name} (${conv.totalMessages} total, ${conv.deletedMessages} deleted by users)`;

    try {
      const data = await api(`/api/admin/conversations/${conv.id}/audit`);
      el.auditMessages.replaceChildren();

      for (const m of data.messages || []) {
        const li = document.createElement('li');
        li.className = `audit-msg-item ${m.isDeleted ? 'deleted-flag' : ''}`;

        const header = document.createElement('div');
        header.style.fontSize = '0.78rem';
        header.style.color = 'var(--muted)';
        header.style.marginBottom = '4px';
        header.innerHTML = `<strong>${m.senderName}</strong> (${m.senderPhone || 'ID:' + m.senderId}) • ${new Date(
          m.ts
        ).toLocaleString()}`;

        if (m.isDeleted) {
          header.innerHTML += ' <span class="audit-deleted-badge">DELETED BY USER</span>';
        }

        const body = document.createElement('div');
        if (m.text) {
          const p = document.createElement('p');
          p.textContent = m.text;
          body.appendChild(p);
        }
        if (m.mediaUrl) {
          const mediaLink = document.createElement('a');
          mediaLink.href = m.mediaUrl;
          mediaLink.target = '_blank';
          mediaLink.textContent = `[View Attached ${m.mediaType}: ${m.mediaName || 'media'}]`;
          body.appendChild(mediaLink);
        }

        li.append(header, body);
        el.auditMessages.appendChild(li);
      }
    } catch (err) {
      toast(err.message);
    }
  }

  /* ------------------------------------------------------------- theme & sidebar */
  function openRail() {
    el.app.classList.add('rail-open');
    el.scrim.hidden = false;
    el.menuBtn.setAttribute('aria-expanded', 'true');
    updateMenuButton(false);
  }

  function closeRail() {
    el.app.classList.remove('rail-open');
    el.scrim.hidden = true;
    el.menuBtn.setAttribute('aria-expanded', 'false');
    updateMenuButton(!!state.activeConversationId);
  }

  function updateMenuButton(hasActiveChat) {
    if (!el.menuBtn) return;
    if (window.innerWidth <= 768 && hasActiveChat) {
      el.menuBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>';
      el.menuBtn.setAttribute('title', 'Back to chats');
      el.menuBtn.setAttribute('aria-label', 'Back to chats');
    } else {
      el.menuBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
      el.menuBtn.setAttribute('title', 'Open navigation');
      el.menuBtn.setAttribute('aria-label', 'Open navigation');
    }
  }

  el.menuBtn.onclick = () => {
    if (el.app.classList.contains('rail-open')) {
      closeRail();
    } else {
      openRail();
    }
  };
  el.scrim.onclick = closeRail;

  window.addEventListener('resize', () => {
    updateMenuButton(!!state.activeConversationId);
  });

  el.log.addEventListener('click', (e) => {
    if (!e.target.closest('.msg-row')) {
      document.querySelectorAll('.msg-row.show-actions').forEach((r) => r.classList.remove('show-actions'));
    }
  });

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('chatbox.theme', next);
    paintTheme();
  }

  function paintTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    el.iconMoon.hidden = isDark;
    el.iconSun.hidden = !isDark;
  }

  el.themeBtn.onclick = toggleTheme;
  el.logoutBtn.onclick = logout;
  el.notifBtn.onclick = toggleNotificationPermission;

  el.tabLogin.onclick = () => setAuthMode(false);
  el.tabRegister.onclick = () => setAuthMode(true);
  el.authForm.onsubmit = handleAuthSubmit;

  if (el.togglePwBtn && el.authPassword) {
    el.togglePwBtn.onclick = () => {
      const isPw = el.authPassword.type === 'password';
      el.authPassword.type = isPw ? 'text' : 'password';
      if (el.pwEye) el.pwEye.hidden = isPw;
      if (el.pwEyeOff) el.pwEyeOff.hidden = !isPw;
    };
  }

  if (el.railSearchInput) {
    el.railSearchInput.addEventListener('input', (e) => {
      searchTerm = e.target.value.toLowerCase().trim();
      renderConversations();
      renderFriends();
    });
  }

  /* ------------------------------------------------------------- init */
  paintTheme();
  initEmojiPicker();
  checkInitialAuth();
})();
