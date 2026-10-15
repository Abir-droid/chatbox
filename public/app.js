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
    navFriendsBadge: $('nav-friends-badge'),
    navAdmin: $('nav-admin'),
    panelChats: $('panel-chats'),
    panelFriends: $('panel-friends'),
    newChatBtn: $('new-chat-btn'),
    chatList: $('chat-list'),
    friendList: $('friend-list'),
    addFriendBtn: $('add-friend-btn'),
    tabMyFriends: $('tab-my-friends'),
    tabFriendRequests: $('tab-friend-requests'),
    requestsBadge: $('requests-badge'),
    requestsList: $('requests-list'),

    meInfo: $('me-info'),
    meAvatar: $('me-avatar'),
    meName: $('me-name'),
    mePhone: $('me-phone'),
    editProfileBtn: $('edit-profile-btn'),
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
    convMoreWrap: $('conv-more-wrap'),
    convMoreBtn: $('conv-more-btn'),
    convDropdown: $('conv-dropdown'),
    deleteConvBtn: $('delete-conv-btn'),

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
    voiceBtn: $('voice-btn'),
    voiceRecordBar: $('voice-record-bar'),
    voiceRecordTimer: $('voice-record-timer'),
    voicePauseBtn: $('voice-pause-btn'),
    voicePulseDot: $('voice-pulse-dot'),
    voiceRecordingLabel: $('voice-recording-label'),
    voiceCancelBtn: $('voice-cancel-btn'),
    voiceSendBtn: $('voice-send-btn'),
    mediaInput: $('media-input'),
    mediaPreviewBar: $('media-preview-bar'),
    mediaPreviewsWrap: $('media-previews-wrap'),
    mediaThumb: $('media-thumb'),
    mediaName: $('media-name'),
    mediaSize: $('media-size'),
    mediaCancel: $('media-cancel'),

    replyPreviewBar: $('reply-preview-bar'),
    replyBarTitle: $('reply-bar-title'),
    replyBarSnippet: $('reply-bar-snippet'),
    replyCancel: $('reply-cancel'),

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

    deleteConvDialog: $('delete-conv-dialog'),
    confirmDeleteConvBtn: $('confirm-delete-conv-btn'),

    profileDialog: $('profile-dialog'),
    profileForm: $('profile-form'),
    profileAvatarPreview: $('profile-avatar-preview'),
    profilePicInput: $('profile-pic-input'),
    profileUploadTrigger: $('profile-upload-trigger'),
    profileRemovePicBtn: $('profile-remove-pic-btn'),
    profileName: $('profile-name'),
    avatarPalette: $('avatar-palette'),
    profilePassword: $('profile-password'),
    profileError: $('profile-error'),
    profileSaveBtn: $('profile-save-btn'),

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

    // Selection Bar
    selectionBar: $('selection-bar'),
    selectionCloseBtn: $('selection-close-btn'),
    selectionCount: $('selection-count'),
    selectionForwardBtn: $('selection-forward-btn'),

    // Drag Drop Overlay
    dragDropOverlay: $('drag-drop-overlay'),

    // Group Friend Picker
    groupFriendsCount: $('group-friends-count'),
    groupFriendsSearch: $('group-friends-search'),
    groupFriendsList: $('group-friends-list'),

    // Forward Dialog
    forwardDialog: $('forward-dialog'),
    forwardSearch: $('forward-search'),
    forwardList: $('forward-list'),
    forwardSelectedCount: $('forward-selected-count'),
    forwardConfirmBtn: $('forward-confirm-btn'),

    // Notification Prompt Dialog
    notifPromptDialog: $('notif-prompt-dialog'),
    notifPromptAllow: $('notif-prompt-allow'),
    notifPromptDismiss: $('notif-prompt-dismiss'),

    toasts: $('toasts'),
  };

  const state = {
    token: localStorage.getItem('chatbox_token') || '',
    user: null,
    conversations: [],
    friends: [],
    friendRequests: [],
    activeConversationId: null,
    selectedFile: null,
    selectedFiles: [],
    replyTarget: null,
    typers: new Map(),
    notificationsEnabled: typeof Notification !== 'undefined' && Notification.permission === 'granted',
    selectionMode: false,
    selectedMessageIds: new Set(),
    selectedForwardTargets: new Set(),
    selectedGroupFriends: new Set(),
    messagesCache: new Map(),
  };

  let socket = null;

  // Force update browser tab favicon with dynamic cache buster to override stale green icon
  try {
    const faviconUrl = `${BASE}/static/favicon.svg?t=${Date.now()}`;
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/svg+xml';
    link.href = faviconUrl;
  } catch {}

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

  /* ----------------------------------------------------------------- sound engine */
  let audioCtx = null;
  function getAudioContext() {
    try {
      if (!audioCtx) {
        const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
        if (AudioCtxClass) {
          audioCtx = new AudioCtxClass();
        }
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
      return audioCtx;
    } catch {
      return null;
    }
  }

  // Sent message sound: satisfying upward pop
  function playSendSound() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.1);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  }

  // Incoming message chime: dual-tone glass ping
  function playReceiveSound() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.22);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.08); // A5
      gain2.gain.setValueAtTime(0.001, now);
      gain2.gain.setValueAtTime(0.14, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.34);
    } catch {}
  }

  // Backward-compatible alias
  function playChime() {
    playReceiveSound();
  }

  // Soft keyboard typing tick (rate-limited for smooth feel)
  let lastTypingTick = 0;
  function playTypingTick() {
    const nowMs = Date.now();
    if (nowMs - lastTypingTick < 70) return;
    lastTypingTick = nowMs;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      const freq = 420 + Math.random() * 80;
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      gain.gain.setValueAtTime(0.028, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch {}
  }

  // Voice recording start sound: brief rising chirp
  function playRecordStartSound() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.08);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  // Voice recording stop sound: brief falling chirp
  function playRecordStopSound() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(380, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderAvatar(elem, name, colorIndex, avatarUrl, isOnline) {
    if (!elem) return;
    elem.replaceChildren();
    if (avatarUrl) {
      elem.className = `avatar u ${isOnline ? 'online' : ''}`;
      const img = document.createElement('img');
      img.className = 'avatar-img';
      img.src = avatarUrl;
      img.alt = name || 'Avatar';
      img.onerror = () => {
        elem.replaceChildren();
        elem.className = `avatar u c-${(colorIndex !== undefined ? colorIndex : 0) % 10} ${isOnline ? 'online' : ''}`;
        elem.textContent = (name || '?').charAt(0).toUpperCase();
      };
      elem.appendChild(img);
    } else {
      elem.className = `avatar u c-${(colorIndex !== undefined ? colorIndex : 0) % 10} ${isOnline ? 'online' : ''}`;
      elem.textContent = (name || '?').charAt(0).toUpperCase();
    }
  }

  /* ------------------------------------------------------------- notifications */
  function sendBrowserNotification(title, body, convId) {
    if (!state.notificationsEnabled || !('Notification' in window)) return;
    try {
      const notif = new Notification(title, {
        body,
        icon: `${BASE}/static/favicon.svg`,
        badge: `${BASE}/static/favicon.svg`,
        tag: `chatbox-${convId || 'general'}`,
        renotify: true,
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

  function checkNotificationPrompt() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default' && !sessionStorage.getItem('notif_prompt_dismissed')) {
      setTimeout(() => {
        if (el.notifPromptDialog && typeof el.notifPromptDialog.showModal === 'function' && !el.notifPromptDialog.open) {
          el.notifPromptDialog.showModal();
        }
      }, 1000);
    }
  }

  function requestBrowserNotificationPermission() {
    if (!('Notification' in window)) {
      toast('Notifications are not supported in this browser.');
      return;
    }
    Notification.requestPermission().then((perm) => {
      state.notificationsEnabled = perm === 'granted';
      if (perm === 'granted') {
        toast('Browser notifications enabled!');
        sendBrowserNotification('Notifications Enabled', 'You will receive alerts for new messages.', null);
      } else {
        toast('Notification permission was not granted.');
      }
    });
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
    if (Notification.permission === 'default') {
      if (el.notifPromptDialog && typeof el.notifPromptDialog.showModal === 'function') {
        el.notifPromptDialog.showModal();
      } else {
        requestBrowserNotificationPermission();
      }
      return;
    }
    toast('Notifications are blocked by your browser settings. Please enable them in your address bar.');
  }

  if (el.notifPromptDismiss) {
    el.notifPromptDismiss.onclick = () => {
      sessionStorage.setItem('notif_prompt_dismissed', '1');
      el.notifPromptDialog.close();
    };
  }

  if (el.notifPromptAllow) {
    el.notifPromptAllow.onclick = () => {
      el.notifPromptDialog.close();
      requestBrowserNotificationPermission();
    };
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
        const err = new Error(data.error || 'Request failed');
        err.status = res.status;
        err.data = data;
        throw err;
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
    renderAvatar(el.meAvatar, state.user.name, state.user.avatar_color, state.user.avatar_url);

    el.navAdmin.hidden = !state.user.is_admin;

    initSocket();
    loadConversations();
    loadFriends();
    loadFriendRequests();
    hideLoader();
    checkNotificationPrompt();

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

    socket.on('role_changed', ({ isAdmin }) => {
      if (state.user) {
        state.user.is_admin = isAdmin;
        el.navAdmin.hidden = !isAdmin;
        toast(isAdmin ? 'You have been granted Administrator rights!' : 'Your admin rights have been revoked.');
      }
    });

    socket.on('message_purged', ({ id }) => {
      const msgEl = document.querySelector(`.msg-row[data-msg-id="${id}"]`);
      if (msgEl) msgEl.remove();
    });

    socket.on('friend_removed', ({ userId, friendId }) => {
      state.friends = state.friends.filter((f) => f.id !== friendId && f.id !== userId);
      renderFriends();
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

    socket.on('user_profile_updated', ({ userId, name, avatarColor, avatarUrl }) => {
      if (state.user && state.user.id === userId) {
        state.user.name = name;
        state.user.avatar_color = avatarColor;
        state.user.avatar_url = avatarUrl;
        el.meName.textContent = name;
        renderAvatar(el.meAvatar, name, avatarColor, avatarUrl);
      }
      for (const conv of state.conversations) {
        if (conv.otherUserId === userId) {
          conv.name = name;
          conv.avatarColor = avatarColor;
          conv.avatarUrl = avatarUrl;
        }
      }
      for (const f of state.friends) {
        if (f.id === userId) {
          f.name = name;
          f.avatarColor = avatarColor;
          f.avatarUrl = avatarUrl;
        }
      }
      renderConversations();
      renderFriends();
      if (state.activeConversationId) {
        const active = state.conversations.find((c) => c.id === state.activeConversationId);
        if (active && active.otherUserId === userId) {
          el.convTitle.textContent = name;
          renderAvatar(el.convAvatar, name, avatarColor, avatarUrl, active.isOnline);
        }
      }
    });

    socket.on('friend_request_received', ({ sender }) => {
      playReceiveSound();
      toast(`Friend request received from ${sender.name}!`);
      loadFriendRequests();
      loadFriends();
    });

    socket.on('friend_request_accepted', ({ friend }) => {
      playReceiveSound();
      toast(`${friend.name} accepted your friend request!`);
      loadFriends();
      loadConversations();
      loadFriendRequests();
    });

    socket.on('conversation_created', ({ conversationId }) => {
      loadConversations();
      if (socket && conversationId) {
        socket.emit('join_conversation', { conversationId });
      }
    });

    socket.on('conversation_updated', ({ conversationId }) => {
      loadConversations();
    });

    socket.on('message', (msg) => {
      if (!msg) return;

      // Auto-join this conversation room on socket so future messages arrive via room as well
      if (socket && msg.conversationId) {
        socket.emit('join_conversation', { conversationId: msg.conversationId });
      }

      state.messagesCache.set(msg.id, msg);

      const isCurrent = state.activeConversationId === msg.conversationId;
      if (isCurrent) {
        const currentConv = state.conversations.find((c) => c.id === msg.conversationId);
        const isGroup = currentConv && currentConv.type === 'group';

        // In group chats, if previous message was from same sender within 1 minute, swap its avatar to an avatar-spacer
        if (isGroup) {
          const lastRow = el.messages.lastElementChild;
          if (lastRow && !lastRow.classList.contains('system') && !lastRow.classList.contains('own')) {
            const lastMsgId = Number(lastRow.id.replace('msg-', ''));
            const lastMsg = state.messagesCache.get(lastMsgId);
            if (lastMsg && lastMsg.senderId === msg.senderId && Math.abs(msg.ts - lastMsg.ts) < 60000) {
              const oldAvatar = lastRow.querySelector('.chat-bubble-avatar');
              if (oldAvatar) {
                const spacer = document.createElement('span');
                spacer.className = 'avatar-spacer';
                spacer.setAttribute('aria-hidden', 'true');
                oldAvatar.replaceWith(spacer);
              }
            }
          }
        }

        appendMessage(msg, true);
        scrollToBottom();
        // Active chat: notify server that user has seen this message
        if (msg.senderId !== state.user.id && socket) {
          socket.emit('conversation_seen', { conversationId: msg.conversationId });
        }
      } else {
        // Chat not currently active: notify server that message was delivered to device
        if (msg.senderId !== state.user.id && socket) {
          socket.emit('message_delivered', { messageId: msg.id, conversationId: msg.conversationId });
        }
      }

      const displayText = msg.mediaType === 'audio'
        ? '🎤 Voice note'
        : (msg.mediaType === 'image' ? '📷 Photo' : (msg.mediaType === 'video' ? '🎥 Video' : msg.text));

      // Update sidebar preview
      let conv = state.conversations.find((c) => c.id === msg.conversationId);
      if (conv) {
        conv.lastMessage = {
          text: displayText,
          senderName: msg.senderName,
          ts: msg.ts,
        };
        // Move to top of chat list
        state.conversations = [conv, ...state.conversations.filter((c) => c.id !== conv.id)];
        renderConversations();
      } else {
        // Conversation is new or unhidden: reload conversations immediately without refresh!
        loadConversations();
      }

      // Audio & Desktop notification if from someone else
      if (msg.senderId !== state.user.id) {
        playReceiveSound();
        const title = conv ? (conv.type === 'group' ? `${conv.name} (${msg.senderName})` : msg.senderName) : msg.senderName;
        const bodyText = displayText;
        if (document.hidden || !isCurrent || !document.hasFocus()) {
          sendBrowserNotification(title, bodyText, msg.conversationId);
        }
      }
    });

    socket.on('message_status_update', ({ messageId, status, conversationId }) => {
      const cached = state.messagesCache.get(messageId);
      if (cached) cached.status = status;
      const checkWrap = $(`msg-check-${messageId}`);
      if (checkWrap) {
        checkWrap.innerHTML = renderTickSvg(status);
      }
    });

    socket.on('conversation_seen', ({ conversationId, seenBy }) => {
      if (state.activeConversationId === conversationId) {
        document.querySelectorAll('#messages .msg-row.own .msg-check-wrap').forEach((wrap) => {
          wrap.innerHTML = renderTickSvg('seen');
        });
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

  function closeAllDropdowns() {
    document.querySelectorAll('.msg-dropdown:not([hidden])').forEach((d) => (d.hidden = true));
    document.querySelectorAll('.msg-down-btn.active').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.msg-row.show-menu').forEach((r) => r.classList.remove('show-menu'));
    document.querySelectorAll('.chat-item-dropdown:not([hidden])').forEach((d) => (d.hidden = true));
    document.querySelectorAll('.chat-item-down-btn.active').forEach((b) => b.classList.remove('active'));
    if (el.convDropdown) el.convDropdown.hidden = true;
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
      if (conv.type === 'group') {
        avatar.className = `avatar c-${conv.avatarColor || 0}`;
        avatar.textContent = '👥';
      } else {
        renderAvatar(avatar, conv.name, conv.avatarColor, conv.avatarUrl, conv.isOnline);
      }

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

      // Down-arrow options dropdown for conversation (Delete chat)
      const itemMenuWrap = document.createElement('div');
      itemMenuWrap.className = 'chat-item-menu-wrap';

      const itemDownBtn = document.createElement('button');
      itemDownBtn.type = 'button';
      itemDownBtn.className = 'chat-item-down-btn';
      itemDownBtn.title = 'Chat options';
      itemDownBtn.setAttribute('aria-label', 'Chat options');
      itemDownBtn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';

      const itemDropdown = document.createElement('div');
      itemDropdown.className = 'chat-item-dropdown';
      itemDropdown.hidden = true;

      const delChatOption = document.createElement('button');
      delChatOption.type = 'button';
      delChatOption.className = 'conv-dropdown-item danger';
      delChatOption.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg><span>Delete Chat</span>';
      delChatOption.onclick = (e) => {
        e.stopPropagation();
        itemDropdown.hidden = true;
        state.activeConversationId = conv.id;
        if (el.deleteConvDialog) el.deleteConvDialog.showModal();
      };
      itemDropdown.appendChild(delChatOption);

      function toggleItemDropdown(e) {
        if (e) {
          e.stopPropagation();
        }
        const willShow = itemDropdown.hidden;
        closeAllDropdowns();
        itemDropdown.hidden = !willShow;
        if (!itemDropdown.hidden) itemDownBtn.classList.add('active');
      }

      itemDownBtn.onclick = toggleItemDropdown;

      // Right-click contextmenu on conversation item
      li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggleItemDropdown(e);
      });

      // Long press on mobile touch screen
      let convTouchTimer = null;
      let convTouchMoved = false;

      li.addEventListener('touchstart', (e) => {
        convTouchMoved = false;
        convTouchTimer = setTimeout(() => {
          if (!convTouchMoved) {
            if (navigator.vibrate) navigator.vibrate(25);
            toggleItemDropdown(e);
          }
        }, 450);
      }, { passive: true });

      li.addEventListener('touchmove', () => {
        convTouchMoved = true;
        if (convTouchTimer) clearTimeout(convTouchTimer);
      }, { passive: true });

      li.addEventListener('touchend', () => {
        if (convTouchTimer) clearTimeout(convTouchTimer);
      });

      li.addEventListener('touchcancel', () => {
        if (convTouchTimer) clearTimeout(convTouchTimer);
      });

      itemMenuWrap.append(itemDownBtn, itemDropdown);
      li.append(avatar, textDiv, itemMenuWrap);
      el.chatList.appendChild(li);
    }
  }

  async function switchConversation(convId) {
    state.activeConversationId = convId;
    exitSelectionMode();
    closeRail();
    updateMenuButton();
    state.typers.clear();
    renderTyping();
    cancelReply();
    clearMediaSelection();

    const conv = state.conversations.find((c) => c.id === convId);
    if (!conv) return;

    renderConversations();

    // Setup Header
    el.convTitle.textContent = conv.name;
    if (conv.type === 'group') {
      el.convAvatar.className = `avatar c-${conv.avatarColor || 0}`;
      el.convAvatar.textContent = '👥';
      el.convSub.textContent = `${conv.memberCount} members`;
      el.manageGroupBtn.hidden = false;
    } else {
      renderAvatar(el.convAvatar, conv.name, conv.avatarColor, conv.avatarUrl, conv.isOnline);
      el.convSub.textContent = `${conv.phone} • ${conv.isOnline ? 'Online' : 'Offline'}`;
      el.manageGroupBtn.hidden = true;
    }
    if (el.convMoreWrap) el.convMoreWrap.hidden = false;
    if (el.convDropdown) el.convDropdown.hidden = true;
    el.deleteConvBtn.hidden = false;

    el.input.disabled = false;
    el.send.disabled = false;
    el.input.placeholder = 'Type a message…';

    // Join room on socket and mark conversation as seen
    if (socket) {
      socket.emit('join_conversation', { conversationId: convId });
      socket.emit('conversation_seen', { conversationId: convId });
    }

    // Load message history
    try {
      const data = await api(`/api/conversations/${convId}/messages`);
      renderMessages(data.messages || []);
    } catch (err) {
      toast(err.message);
    }
  }

  function renderTickSvg(status) {
    const s = status || 'sent';
    if (s === 'seen') {
      return '<svg viewBox="0 0 20 16" class="tick-svg seen" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-label="Seen" title="Seen"><path d="M1 8.5L5 12.5L13.5 4"/><path d="M5.5 8.5L9.5 12.5L18 4"/></svg>';
    } else if (s === 'delivered') {
      return '<svg viewBox="0 0 20 16" class="tick-svg delivered" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-label="Delivered" title="Delivered"><path d="M1 8.5L5 12.5L13.5 4"/><path d="M5.5 8.5L9.5 12.5L18 4"/></svg>';
    } else {
      return '<svg viewBox="0 0 16 16" class="tick-svg sent" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-label="Sent" title="Sent"><path d="M2.5 8.5L6.5 12.5L14.5 4.5"/></svg>';
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
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];
        state.messagesCache.set(msg.id, msg);

        let isLastInCluster = true;
        if (i < messages.length - 1) {
          const nextMsg = messages[i + 1];
          const sameSender = nextMsg.senderId === msg.senderId;
          const nextNotSystem = nextMsg.senderName !== 'System';
          const sameMinute = Math.abs(nextMsg.ts - msg.ts) < 60000;
          if (sameSender && nextNotSystem && sameMinute) {
            isLastInCluster = false;
          }
        }

        appendMessage(msg, isLastInCluster);
      }
      scrollToBottom();
    }
  }

  function appendMessage(msg, isLastInCluster = true) {
    el.emptyState.hidden = true;
    state.messagesCache.set(msg.id, msg);

    const isOwn = msg.senderId === state.user.id;
    const isSystem = msg.senderName === 'System';

    const li = document.createElement('li');
    li.className = `msg-row ${isOwn ? 'own' : ''} ${isSystem ? 'system' : ''}`;
    li.id = `msg-${msg.id}`;

    if (state.selectedMessageIds.has(msg.id)) {
      li.classList.add('selected');
    }

    if (isSystem) {
      const bubble = document.createElement('div');
      bubble.className = 'system-bubble';
      bubble.textContent = msg.text;
      li.appendChild(bubble);
      el.messages.appendChild(li);
      return;
    }

    // Selection checkbox for selection mode
    const selectCheck = document.createElement('div');
    selectCheck.className = 'msg-select-check';
    selectCheck.setAttribute('aria-label', 'Select message');
    selectCheck.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
    selectCheck.onclick = (e) => {
      e.stopPropagation();
      toggleMessageSelection(msg.id);
    };
    li.appendChild(selectCheck);

    li.addEventListener('click', (e) => {
      if (state.selectionMode) {
        e.stopPropagation();
        toggleMessageSelection(msg.id);
      }
    });

    const activeConv = state.conversations.find((c) => c.id === (msg.conversationId || state.activeConversationId));
    const isGroup = activeConv && activeConv.type === 'group';

    // Avatar for other user: ONLY in group chats (Meta Messenger style clustering in groups)
    if (!isOwn && isGroup) {
      if (isLastInCluster) {
        const avatar = document.createElement('span');
        avatar.className = 'avatar chat-bubble-avatar';
        renderAvatar(avatar, msg.senderName, activeConv ? activeConv.avatarColor : 0, activeConv ? activeConv.avatarUrl : null);
        li.appendChild(avatar);
      } else {
        const spacer = document.createElement('span');
        spacer.className = 'avatar-spacer';
        spacer.setAttribute('aria-hidden', 'true');
        li.appendChild(spacer);
      }
    }

    const bodyDiv = document.createElement('div');
    bodyDiv.className = 'msg-body';

    // Swipe reply indicator icon behind bubble
    const swipeIcon = document.createElement('div');
    swipeIcon.className = 'swipe-reply-icon';
    swipeIcon.setAttribute('aria-hidden', 'true');
    swipeIcon.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>';
    bodyDiv.appendChild(swipeIcon);

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.id = `msg-bubble-${msg.id}`;

    // Sender name inside bubble for incoming messages in group chats
    if (isGroup && !isOwn) {
      const authorDiv = document.createElement('div');
      authorDiv.className = 'bubble-author';
      authorDiv.textContent = msg.senderName;
      bubble.appendChild(authorDiv);
    }

    // Quoted reply block (if message is replying to another message)
    const replyTargetId = msg.replyToId || msg.reply_to_id;
    if (replyTargetId) {
      const quoteDiv = document.createElement('div');
      quoteDiv.className = 'msg-reply-quote';
      quoteDiv.title = 'Click to jump to replied message';
      const replyAuthor = msg.replyToSender || msg.reply_to_sender || 'User';
      const replySnippet = msg.replyToText || msg.reply_to_text || 'Original message';
      quoteDiv.innerHTML = `
        <div class="msg-reply-body">
          <span class="msg-reply-author">${escapeHtml(replyAuthor)}</span>
          <span class="msg-reply-snippet">${escapeHtml(replySnippet)}</span>
        </div>
      `;
      quoteDiv.onclick = (e) => {
        e.stopPropagation();
        const targetRow = document.getElementById(`msg-${replyTargetId}`);
        if (targetRow) {
          targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetRow.classList.add('highlight-flash');
          setTimeout(() => targetRow.classList.remove('highlight-flash'), 1600);
        } else {
          toast('Replied message is further up in history');
        }
      };
      bubble.appendChild(quoteDiv);
    }

    // Media (Photo, Video, or Audio / Voice Note)
    const mediaUrl = msg.mediaUrl || msg.media_url;
    let isAudio = false;
    let isVideo = false;
    let mediaDiv = null;

    if (mediaUrl) {
      mediaDiv = document.createElement('div');
      const rawType = (msg.mediaType || msg.media_type || '').toLowerCase();
      const mediaName = (msg.mediaName || msg.media_name || '').toLowerCase();
      isAudio =
        rawType === 'audio' ||
        rawType.startsWith('audio/') ||
        mediaName.includes('voice note') ||
        /\.(webm|ogg|wav|mp3|m4a|aac|opus)(\?|$)/i.test(mediaUrl);
      isVideo =
        !isAudio &&
        (rawType === 'video' ||
         rawType.startsWith('video/') ||
         /\.(mp4|mov|mkv)(\?|$)/i.test(mediaUrl));

      if (isAudio) {
        bubble.classList.add('has-audio');
        mediaDiv.className = 'msg-media msg-audio';
        const header = document.createElement('div');
        header.className = 'voice-bubble-header';
        header.innerHTML = '<svg viewBox="0 0 24 24" class="voice-bubble-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg><span>Voice Note</span>';

        const audio = document.createElement('audio');
        audio.src = mediaUrl;
        audio.controls = true;
        audio.preload = 'metadata';
        mediaDiv.append(header, audio);
      } else if (isVideo) {
        if (!msg.text) {
          bubble.classList.add('has-media-only');
        } else {
          bubble.classList.add('has-media');
        }
        mediaDiv.className = 'msg-media';
        const video = document.createElement('video');
        video.src = mediaUrl;
        video.controls = true;
        video.preload = 'metadata';
        mediaDiv.appendChild(video);
      } else {
        if (!msg.text) {
          bubble.classList.add('has-media-only');
        } else {
          bubble.classList.add('has-media');
        }
        mediaDiv.className = 'msg-media';
        const img = document.createElement('img');
        img.src = mediaUrl;
        img.alt = msg.mediaName || 'Photo';
        img.loading = 'lazy';
        img.onclick = () => openLightbox(mediaUrl);
        mediaDiv.appendChild(img);
      }
      bubble.appendChild(mediaDiv);
    }

    if (msg.text) {
      const textP = document.createElement('p');
      textP.textContent = msg.text;
      bubble.appendChild(textP);
    }

    // Integrated WhatsApp-style metadata (time & seen/unseen ticks inside bubble)
    const bubbleMeta = document.createElement('div');
    bubbleMeta.className = 'bubble-meta';

    const timeSpan = document.createElement('span');
    timeSpan.className = 'bubble-time';
    timeSpan.textContent = formatShortTime(msg.ts);
    bubbleMeta.appendChild(timeSpan);

    if (isOwn) {
      const checkWrap = document.createElement('span');
      checkWrap.className = 'msg-check-wrap';
      checkWrap.id = `msg-check-${msg.id}`;
      checkWrap.innerHTML = renderTickSvg(msg.status);
      bubbleMeta.appendChild(checkWrap);
    }
    bubble.appendChild(bubbleMeta);

    bodyDiv.appendChild(bubble);

    // Message options menu (down arrow on hover, right click, mobile long-press)
    const menuWrap = document.createElement('div');
    menuWrap.className = 'msg-menu-wrap';

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'msg-down-btn';
    downBtn.title = 'Message options';
    downBtn.setAttribute('aria-label', 'Message options');
    downBtn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';

    const dropdown = document.createElement('div');
    dropdown.className = 'msg-dropdown';
    dropdown.hidden = true;

    function toggleMsgMenu(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const willOpen = dropdown.hidden;
      closeAllDropdowns();
      if (willOpen) {
        dropdown.hidden = false;
        downBtn.classList.add('active');
        li.classList.add('show-menu');

        // Check if menu would overflow below the visible log area
        dropdown.classList.remove('open-up');
        if (el.log) {
          const dRect = dropdown.getBoundingClientRect();
          const lRect = el.log.getBoundingClientRect();
          if (dRect.bottom > lRect.bottom && dRect.top - dRect.height > lRect.top) {
            dropdown.classList.add('open-up');
          }
        }
      }
    }

    downBtn.onclick = (e) => toggleMsgMenu(e);

    // Context menu (Right-click) on bubble
    bubble.addEventListener('contextmenu', (e) => {
      toggleMsgMenu(e);
    });

    // Touchscreen: Swipe to reply & Long-Press (420ms)
    let touchTimer = null;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoved = false;
    let isSwiping = false;
    let hasVibrated = false;

    bubble.addEventListener('touchstart', (e) => {
      if (state.selectionMode) return;
      touchMoved = false;
      isSwiping = false;
      hasVibrated = false;
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;

      touchTimer = setTimeout(() => {
        if (!touchMoved && !isSwiping) {
          if (navigator.vibrate) {
            try { navigator.vibrate(25); } catch {}
          }
          toggleMsgMenu(e);
        }
      }, 420);
    }, { passive: true });

    bubble.addEventListener('touchmove', (e) => {
      if (state.selectionMode) return;
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;

      if (!isSwiping) {
        if (Math.abs(dy) > Math.abs(dx) || Math.abs(dy) > 10) {
          touchMoved = true;
          if (touchTimer) clearTimeout(touchTimer);
          return;
        }
        if (dx > 12 && Math.abs(dx) > Math.abs(dy) * 1.2) {
          isSwiping = true;
          touchMoved = true;
          if (touchTimer) clearTimeout(touchTimer);
        }
      }

      if (isSwiping) {
        if (e.cancelable) e.preventDefault();
        const pull = Math.min(Math.max(dx * 0.6, 0), 75);
        bubble.style.transform = `translateX(${pull}px)`;
        bubble.style.transition = 'none';

        if (pull > 6) {
          swipeIcon.style.opacity = Math.min(pull / 30, 1).toString();
          swipeIcon.style.visibility = 'visible';
          swipeIcon.style.transform = `translateY(-50%) scale(${0.65 + (pull / 45) * 0.4})`;
        } else {
          swipeIcon.style.opacity = '0';
          swipeIcon.style.visibility = 'hidden';
        }

        if (pull >= 45 && !hasVibrated) {
          if (navigator.vibrate) try { navigator.vibrate(20); } catch {}
          hasVibrated = true;
          bubble.classList.add('swipe-reply-ready');
          swipeIcon.classList.add('ready');
        } else if (pull < 45 && hasVibrated) {
          hasVibrated = false;
          bubble.classList.remove('swipe-reply-ready');
          swipeIcon.classList.remove('ready');
        }
      }
    }, { passive: false });

    const finishTouch = () => {
      if (touchTimer) clearTimeout(touchTimer);
      if (isSwiping) {
        bubble.style.transition = 'transform 0.22s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        bubble.style.transform = 'translateX(0px)';
        bubble.classList.remove('swipe-reply-ready');
        swipeIcon.classList.remove('ready');
        swipeIcon.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
        swipeIcon.style.opacity = '0';
        swipeIcon.style.visibility = 'hidden';
        swipeIcon.style.transform = 'translateY(-50%) scale(0.6)';
        if (hasVibrated) {
          startReply(msg);
        }
        isSwiping = false;
      }
    };

    bubble.addEventListener('touchend', finishTouch);
    bubble.addEventListener('touchcancel', finishTouch);

    // Option 1: Reply to message
    const replyItem = document.createElement('button');
    replyItem.type = 'button';
    replyItem.className = 'msg-dropdown-item';
    replyItem.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg><span>Reply</span>';
    replyItem.onclick = (e) => {
      e.stopPropagation();
      closeAllDropdowns();
      startReply(msg);
    };
    dropdown.appendChild(replyItem);

    // Option 2: Copy Text
    if (msg.text) {
      const copyItem = document.createElement('button');
      copyItem.type = 'button';
      copyItem.className = 'msg-dropdown-item';
      copyItem.innerHTML = '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copy text</span>';
      copyItem.onclick = async (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        try {
          await navigator.clipboard.writeText(msg.text);
          toast('Copied message to clipboard');
        } catch {
          toast('Failed to copy');
        }
      };
      dropdown.appendChild(copyItem);
    }

    // Option 3: Select messages (Multi-select & Forward)
    const selectItem = document.createElement('button');
    selectItem.type = 'button';
    selectItem.className = 'msg-dropdown-item';
    selectItem.innerHTML = '<svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="2"/><circle cx="4" cy="12" r="2"/><circle cx="4" cy="18" r="2"/></svg><span>Select messages</span>';
    selectItem.onclick = (e) => {
      e.stopPropagation();
      closeAllDropdowns();
      enterSelectionMode(msg.id);
    };
    dropdown.appendChild(selectItem);

    // Option 4: Download Media (if media present)
    if (mediaUrl) {
      const downloadItem = document.createElement('button');
      downloadItem.type = 'button';
      downloadItem.className = 'msg-dropdown-item';
      downloadItem.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span>Download media</span>';
      downloadItem.onclick = async (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        try {
          toast('Downloading media…');
          const response = await fetch(mediaUrl);
          if (!response.ok) throw new Error('Download failed');
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = blobUrl;
          let filename = msg.mediaName || '';
          if (!filename || filename === 'Photo' || filename === 'Video' || filename === 'Voice note') {
            const ext = mediaUrl.split('.').pop().split('?')[0] || 'bin';
            filename = `chatbox-${Date.now()}.${ext}`;
          }
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
          }, 1000);
        } catch (err) {
          const a = document.createElement('a');
          a.href = mediaUrl;
          a.download = msg.mediaName || 'download';
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      };
      dropdown.appendChild(downloadItem);
    }

    // Option 5: Delete Message (if owner or admin)
    if (isOwn || (state.user && state.user.is_admin)) {
      const delItem = document.createElement('button');
      delItem.type = 'button';
      delItem.className = 'msg-dropdown-item danger';
      delItem.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg><span>Delete message</span>';
      delItem.onclick = (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        deleteMessage(msg.id);
      };
      dropdown.appendChild(delItem);
    }

    if (dropdown.children.length > 0) {
      menuWrap.append(downBtn, dropdown);
      li.appendChild(menuWrap);
    }

    li.appendChild(bodyDiv);
    el.messages.appendChild(li);
  }

  async function deleteMessage(msgId) {
    if (!confirm('Delete this message?')) return;
    try {
      await api(`/api/messages/${msgId}`, { method: 'DELETE' });
      const row = $(`msg-${msgId}`);
      if (row) {
        const menu = row.querySelector('.msg-menu-wrap');
        if (menu) menu.remove();
      }
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

  /* ------------------------------------------------------------- media upload & drag-drop */
  function handleMediaFiles(files) {
    if (!files || !files.length) return;
    if (!state.selectedFiles) state.selectedFiles = [];

    const fileList = Array.isArray(files) ? files : Array.from(files);
    for (const f of fileList) {
      if (!f) continue;
      const exists = state.selectedFiles.some((item) => item.name === f.name && item.size === f.size);
      if (!exists) {
        state.selectedFiles.push(f);
      }
    }
    state.selectedFile = state.selectedFiles[0] || null;
    renderMediaPreview();
    el.input.focus();
  }

  function handleMediaFile(file) {
    if (file) handleMediaFiles([file]);
  }

  function renderMediaPreview() {
    if (!state.selectedFiles || !state.selectedFiles.length) {
      clearMediaSelection();
      return;
    }

    if (el.mediaPreviewsWrap) {
      el.mediaPreviewsWrap.replaceChildren();
      state.selectedFiles.forEach((file, idx) => {
        const chip = document.createElement('div');
        chip.className = 'media-preview-chip';
        chip.title = file.name;

        if (file.type && file.type.startsWith('image/')) {
          const url = URL.createObjectURL(file);
          chip.style.backgroundImage = `url(${url})`;
        } else {
          chip.textContent = file.type && file.type.startsWith('video/') ? '🎥' : (file.type && file.type.startsWith('audio/') ? '🎵' : '📁');
        }

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'media-chip-remove';
        removeBtn.title = 'Remove file';
        removeBtn.setAttribute('aria-label', 'Remove file');
        removeBtn.innerHTML = '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        removeBtn.onclick = (e) => {
          e.stopPropagation();
          state.selectedFiles.splice(idx, 1);
          state.selectedFile = state.selectedFiles[0] || null;
          renderMediaPreview();
        };

        chip.appendChild(removeBtn);
        el.mediaPreviewsWrap.appendChild(chip);
      });
    }

    const totalBytes = state.selectedFiles.reduce((acc, f) => acc + f.size, 0);
    const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);

    if (state.selectedFiles.length === 1) {
      const single = state.selectedFiles[0];
      el.mediaName.textContent = single.name || (single.type && single.type.startsWith('image/') ? 'Pasted Image' : 'Media file');
      el.mediaSize.textContent = `${(single.size / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      el.mediaName.textContent = `${state.selectedFiles.length} files selected`;
      el.mediaSize.textContent = `${totalMb} MB total`;
    }

    el.mediaPreviewBar.hidden = false;
  }

  el.attachBtn.onclick = () => el.mediaInput.click();

  el.mediaInput.onchange = () => {
    const files = el.mediaInput.files && Array.from(el.mediaInput.files);
    if (files && files.length) handleMediaFiles(files);
  };

  el.mediaCancel.onclick = clearMediaSelection;

  function clearMediaSelection() {
    state.selectedFiles = [];
    state.selectedFile = null;
    if (el.mediaInput) el.mediaInput.value = '';
    if (el.mediaPreviewsWrap) el.mediaPreviewsWrap.replaceChildren();
    if (el.mediaPreviewBar) el.mediaPreviewBar.hidden = true;
  }

  // Clipboard Paste Support (multiple files or text)
  el.input.addEventListener('paste', (e) => {
    const items = (e.clipboardData || window.clipboardData)?.items;
    if (!items) return;
    const pastedFiles = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' || (item.type && (item.type.startsWith('image/') || item.type.startsWith('video/') || item.type.startsWith('audio/')))) {
        const file = item.getAsFile();
        if (file) pastedFiles.push(file);
      }
    }
    if (pastedFiles.length > 0) {
      e.preventDefault();
      handleMediaFiles(pastedFiles);
    }
  });

  // Desktop Drag & Drop Support (multiple files)
  let dragCounter = 0;
  window.addEventListener('dragenter', (e) => {
    if (!e.dataTransfer || !e.dataTransfer.types) return;
    const isFiles = Array.from(e.dataTransfer.types).includes('Files');
    if (!isFiles) return;
    dragCounter++;
    if (state.activeConversationId && el.dragDropOverlay) {
      el.dragDropOverlay.hidden = false;
    }
  });

  window.addEventListener('dragleave', (e) => {
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      if (el.dragDropOverlay) el.dragDropOverlay.hidden = true;
    }
  });

  window.addEventListener('dragover', (e) => {
    if (!e.dataTransfer || !e.dataTransfer.types) return;
    const isFiles = Array.from(e.dataTransfer.types).includes('Files');
    if (!isFiles) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  window.addEventListener('drop', (e) => {
    dragCounter = 0;
    if (el.dragDropOverlay) el.dragDropOverlay.hidden = true;
    if (!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
    e.preventDefault();
    if (!state.activeConversationId) {
      toast('Open a conversation to send media');
      return;
    }
    const files = Array.from(e.dataTransfer.files);
    handleMediaFiles(files);
  });

  /* ------------------------------------------------------------- message selection & forward */
  function enterSelectionMode(initialMsgId) {
    state.selectionMode = true;
    state.selectedMessageIds.clear();
    if (initialMsgId) state.selectedMessageIds.add(initialMsgId);
    el.messages.classList.add('selection-mode');
    if (el.selectionBar) el.selectionBar.hidden = false;
    if (el.composer) el.composer.hidden = true;
    updateSelectionUi();
  }

  function exitSelectionMode() {
    state.selectionMode = false;
    state.selectedMessageIds.clear();
    el.messages.classList.remove('selection-mode');
    if (el.selectionBar) el.selectionBar.hidden = true;
    if (el.composer) el.composer.hidden = false;
    updateSelectionUi();
  }

  function toggleMessageSelection(msgId) {
    if (!state.selectionMode) return;
    if (state.selectedMessageIds.has(msgId)) {
      state.selectedMessageIds.delete(msgId);
    } else {
      state.selectedMessageIds.add(msgId);
    }
    if (state.selectedMessageIds.size === 0) {
      exitSelectionMode();
      return;
    }
    updateSelectionUi();
  }

  function updateSelectionUi() {
    const totalSelected = state.selectedMessageIds.size;
    if (el.selectionCount) {
      el.selectionCount.textContent = `${totalSelected} selected`;
    }
    if (el.selectionForwardBtn) {
      el.selectionForwardBtn.disabled = totalSelected === 0;
    }
    document.querySelectorAll('#messages .msg-row').forEach((row) => {
      const id = Number(row.id.replace('msg-', ''));
      if (state.selectedMessageIds.has(id)) {
        row.classList.add('selected');
      } else {
        row.classList.remove('selected');
      }
    });
  }

  if (el.selectionCloseBtn) {
    el.selectionCloseBtn.onclick = exitSelectionMode;
  }

  if (el.selectionForwardBtn) {
    el.selectionForwardBtn.onclick = openForwardDialog;
  }

  function openForwardDialog() {
    state.selectedForwardTargets.clear();
    if (el.forwardSearch) el.forwardSearch.value = '';
    renderForwardList();
    if (el.forwardSelectedCount) el.forwardSelectedCount.textContent = '0 selected';
    if (el.forwardConfirmBtn) el.forwardConfirmBtn.disabled = true;
    if (el.forwardDialog) el.forwardDialog.showModal();
  }

  function renderForwardList(query = '') {
    if (!el.forwardList) return;
    el.forwardList.replaceChildren();
    const q = (query || '').toLowerCase().trim();

    const destinations = [];
    // Existing conversations
    for (const c of state.conversations) {
      destinations.push({
        targetKey: `c:${c.id}`,
        name: c.name,
        sub: c.type === 'group' ? `${c.memberCount || 2} members` : (c.phone || 'Direct Chat'),
        type: c.type,
        avatarColor: c.avatarColor,
        avatarUrl: c.avatarUrl,
        convId: c.id,
      });
    }
    // Friends who aren't already represented as direct conversations
    for (const f of state.friends) {
      const alreadyConv = state.conversations.find((c) => c.type === 'direct' && c.phone === f.phone);
      if (!alreadyConv) {
        destinations.push({
          targetKey: `f:${f.phone}`,
          name: f.name,
          sub: f.phone,
          type: 'friend',
          avatarColor: f.avatarColor,
          avatarUrl: f.avatarUrl,
          friendPhone: f.phone,
        });
      }
    }

    const filtered = destinations.filter((d) => {
      return !q || d.name.toLowerCase().includes(q) || (d.sub && d.sub.toLowerCase().includes(q));
    });

    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'picker-empty';
      empty.textContent = q ? `No chats or friends match "${query}"` : 'No available chats or friends';
      el.forwardList.appendChild(empty);
      return;
    }

    filtered.forEach((d) => {
      const label = document.createElement('label');
      label.className = 'forward-target-item';
      
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'forward-target-check';
      check.checked = state.selectedForwardTargets.has(d.targetKey);
      check.onchange = () => {
        if (check.checked) {
          state.selectedForwardTargets.add(d.targetKey);
        } else {
          state.selectedForwardTargets.delete(d.targetKey);
        }
        const count = state.selectedForwardTargets.size;
        if (el.forwardSelectedCount) el.forwardSelectedCount.textContent = `${count} selected`;
        if (el.forwardConfirmBtn) el.forwardConfirmBtn.disabled = count === 0;
      };

      const avatar = document.createElement('span');
      avatar.className = 'avatar small';
      renderAvatar(avatar, d.name, d.avatarColor || 0, d.avatarUrl || null);

      const info = document.createElement('div');
      info.className = 'forward-target-info';
      const name = document.createElement('span');
      name.className = 'forward-target-name';
      name.textContent = d.name;
      const sub = document.createElement('span');
      sub.className = 'forward-target-sub';
      sub.textContent = d.sub;
      info.append(name, sub);

      label.append(check, avatar, info);
      el.forwardList.appendChild(label);
    });
  }

  if (el.forwardSearch) {
    el.forwardSearch.oninput = () => renderForwardList(el.forwardSearch.value);
  }

  if (el.forwardConfirmBtn) {
    el.forwardConfirmBtn.onclick = confirmForward;
  }

  async function confirmForward() {
    if (!state.selectedForwardTargets.size || !state.selectedMessageIds.size) return;
    if (el.forwardConfirmBtn) el.forwardConfirmBtn.disabled = true;

    const msgs = Array.from(state.selectedMessageIds)
      .map((id) => state.messagesCache.get(id))
      .filter(Boolean)
      .sort((a, b) => (a.ts || a.id) - (b.ts || b.id));

    toast(`Forwarding ${msgs.length} message${msgs.length > 1 ? 's' : ''}…`);

    for (const targetKey of state.selectedForwardTargets) {
      let targetConvId = null;
      if (targetKey.startsWith('c:')) {
        targetConvId = Number(targetKey.slice(2));
      } else if (targetKey.startsWith('f:')) {
        const phone = targetKey.slice(2);
        try {
          const res = await api('/api/conversations/direct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
          });
          if (res && res.conversation) targetConvId = res.conversation.id;
        } catch (e) {
          continue;
        }
      }

      if (targetConvId && socket) {
        for (const m of msgs) {
          socket.emit('message', {
            conversationId: targetConvId,
            text: m.text || '',
            mediaUrl: m.mediaUrl || null,
            mediaType: m.mediaType || null,
            mediaName: m.mediaName || null,
          });
        }
      }
    }

    if (el.forwardDialog) el.forwardDialog.close();
    exitSelectionMode();
    toast('Messages forwarded successfully');
    loadConversations();
  }

  /* ------------------------------------------------------------- reply feature */
  function startReply(msg) {
    let snippet = msg.text || '';
    if (!snippet) {
      const type = (msg.mediaType || msg.media_type || '').toLowerCase();
      if (type === 'audio') snippet = 'Voice note';
      else if (type === 'image') snippet = 'Photo';
      else if (type === 'video') snippet = 'Video';
      else snippet = 'Attachment';
    }
    const senderName = msg.senderName || (msg.senderId === state.user?.id ? 'You' : 'User');
    state.replyTarget = {
      id: msg.id,
      senderName,
      text: snippet.length > 80 ? snippet.slice(0, 80) + '…' : snippet,
    };

    if (el.replyPreviewBar) {
      if (el.replyBarTitle) el.replyBarTitle.textContent = `Replying to ${state.replyTarget.senderName}`;
      if (el.replyBarSnippet) el.replyBarSnippet.textContent = state.replyTarget.text;
      el.replyPreviewBar.hidden = false;
    }
    el.input.focus();
  }

  function cancelReply() {
    state.replyTarget = null;
    if (el.replyPreviewBar) {
      el.replyPreviewBar.hidden = true;
    }
  }

  if (el.replyCancel) {
    el.replyCancel.onclick = cancelReply;
  }

  function openLightbox(url) {
    el.lightboxImg.src = url;
    el.lightboxDialog.showModal();
  }

  el.lightboxClose.onclick = () => el.lightboxDialog.close();

  el.lightboxDialog.onclick = (e) => {
    if (e.target !== el.lightboxImg) {
      el.lightboxDialog.close();
    }
  };

  /* ------------------------------------------------------------- sending */
  el.composer.onsubmit = async (e) => {
    e.preventDefault();
    if (!state.activeConversationId) return;

    const text = el.input.value.trim();
    const filesToSend = (state.selectedFiles && state.selectedFiles.length > 0)
      ? state.selectedFiles
      : (state.selectedFile ? [state.selectedFile] : []);

    if (!text && !filesToSend.length) return;

    el.send.disabled = true;

    try {
      if (filesToSend.length > 0) {
        toast(`Uploading ${filesToSend.length} media file${filesToSend.length > 1 ? 's' : ''}…`);
        const fd = new FormData();
        for (const file of filesToSend) {
          fd.append('media', file);
        }

        const endpoint = filesToSend.length > 1 ? `${BASE}/api/upload-multiple` : `${BASE}/api/upload`;
        const uploadRes = await fetch(endpoint, {
          method: 'POST',
          headers: { Authorization: `Bearer ${state.token}` },
          body: fd,
        });

        const data = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(data.error || 'Media upload failed');

        const uploadedList = data.files || [{ url: data.url, mediaType: data.mediaType, mediaName: data.mediaName }];

        for (let i = 0; i < uploadedList.length; i++) {
          const item = uploadedList[i];
          const payload = {
            conversationId: state.activeConversationId,
            text: i === 0 ? text : '',
            mediaUrl: item.url,
            mediaType: item.mediaType,
            mediaName: item.mediaName,
          };

          if (i === 0 && state.replyTarget) {
            payload.replyToId = state.replyTarget.id;
            payload.replyToSender = state.replyTarget.senderName;
            payload.replyToText = state.replyTarget.text;
          }

          socket.emit('message', payload, (ack) => {
            if (ack && !ack.ok) {
              toast(ack.error || 'Failed to send message');
            }
          });
        }
      } else {
        const payload = {
          conversationId: state.activeConversationId,
          text,
          mediaUrl: null,
          mediaType: null,
          mediaName: null,
        };

        if (state.replyTarget) {
          payload.replyToId = state.replyTarget.id;
          payload.replyToSender = state.replyTarget.senderName;
          payload.replyToText = state.replyTarget.text;
        }

        socket.emit('message', payload, (ack) => {
          if (ack && !ack.ok) {
            toast(ack.error || 'Failed to send message');
          }
        });
      }

      playSendSound();
      el.input.value = '';
      clearMediaSelection();
      cancelReply();
    } catch (err) {
      toast(err.message);
    } finally {
      el.send.disabled = false;
      el.input.focus();
    }
  };

  // Enter to send message, Shift+Enter for newline
  el.input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!el.send.disabled) {
        if (typeof el.composer.requestSubmit === 'function') {
          el.composer.requestSubmit();
        } else {
          el.composer.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      }
    }
  });

  // Typing indicator broadcast & typing sound effect
  let typingTimer = null;
  el.input.oninput = () => {
    playTypingTick();
    if (!state.activeConversationId || !socket) return;
    socket.emit('typing', { conversationId: state.activeConversationId, typing: true });
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      socket.emit('typing', { conversationId: state.activeConversationId, typing: false });
    }, 2000);
  };

  // Mobile virtual keyboard handling: lock window scroll so header remains pinned at top
  function keepHeaderPinned() {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    if (document.documentElement) document.documentElement.scrollTop = 0;
    scrollToBottom();
  }

  el.input.addEventListener('focus', () => {
    keepHeaderPinned();
    setTimeout(keepHeaderPinned, 60);
    setTimeout(keepHeaderPinned, 180);
    setTimeout(keepHeaderPinned, 350);
  });

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', keepHeaderPinned);
    window.visualViewport.addEventListener('scroll', () => {
      window.scrollTo(0, 0);
    });
  }

  /* ------------------------------------------------------------- voice messages */
  let mediaRecorder = null;
  let voiceStream = null;
  let voiceChunks = [];
  let voiceTimerInterval = null;
  let voiceSeconds = 0;
  let isVoicePaused = false;

  function resetVoiceUi() {
    isVoicePaused = false;
    if (el.voicePulseDot) el.voicePulseDot.classList.remove('paused');
    if (el.voiceRecordingLabel) el.voiceRecordingLabel.textContent = 'Recording voice note…';
    if (el.voicePauseBtn) {
      el.voicePauseBtn.title = 'Pause recording';
      el.voicePauseBtn.setAttribute('aria-label', 'Pause recording');
      el.voicePauseBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
    }
  }

  function toggleVoicePause() {
    if (!mediaRecorder) return;
    if (mediaRecorder.state === 'recording') {
      try {
        mediaRecorder.pause();
      } catch (err) {
        console.warn('pause failed', err);
      }
      isVoicePaused = true;
      clearInterval(voiceTimerInterval);
      if (el.voicePulseDot) el.voicePulseDot.classList.add('paused');
      if (el.voiceRecordingLabel) el.voiceRecordingLabel.textContent = 'Recording paused';
      if (el.voicePauseBtn) {
        el.voicePauseBtn.title = 'Resume recording';
        el.voicePauseBtn.setAttribute('aria-label', 'Resume recording');
        el.voicePauseBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>';
      }
    } else if (mediaRecorder.state === 'paused') {
      try {
        mediaRecorder.resume();
      } catch (err) {
        console.warn('resume failed', err);
      }
      isVoicePaused = false;
      if (el.voicePulseDot) el.voicePulseDot.classList.remove('paused');
      if (el.voiceRecordingLabel) el.voiceRecordingLabel.textContent = 'Recording voice note…';
      if (el.voicePauseBtn) {
        el.voicePauseBtn.title = 'Pause recording';
        el.voicePauseBtn.setAttribute('aria-label', 'Pause recording');
        el.voicePauseBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
      }
      voiceTimerInterval = setInterval(() => {
        voiceSeconds++;
        const mins = Math.floor(voiceSeconds / 60);
        const secs = voiceSeconds % 60;
        el.voiceRecordTimer.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      }, 1000);
    }
  }

  async function startVoiceRecording() {
    if (!state.activeConversationId) {
      toast('Please select a conversation first');
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast('Microphone access is not supported in this browser or requires HTTPS.');
      return;
    }

    try {
      voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceChunks = [];
      voiceSeconds = 0;
      resetVoiceUi();
      el.voiceRecordTimer.textContent = '0:00';
      el.voiceRecordBar.hidden = false;
      playRecordStartSound();

      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options = { mimeType: 'audio/webm;codecs=opus' };
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        options = { mimeType: 'audio/ogg' };
      }

      mediaRecorder = new MediaRecorder(voiceStream, options);
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) voiceChunks.push(e.data);
      };

      mediaRecorder.start(250);

      voiceTimerInterval = setInterval(() => {
        voiceSeconds++;
        const mins = Math.floor(voiceSeconds / 60);
        const secs = voiceSeconds % 60;
        el.voiceRecordTimer.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      }, 1000);
    } catch (err) {
      toast('Microphone access denied or audio recording failed.');
      el.voiceRecordBar.hidden = true;
      resetVoiceUi();
      if (voiceStream) {
        voiceStream.getTracks().forEach((t) => t.stop());
        voiceStream = null;
      }
    }
  }

  function stopVoiceRecording(discard = false) {
    if (!mediaRecorder) return;
    const rec = mediaRecorder;
    const stream = voiceStream;
    clearInterval(voiceTimerInterval);
    el.voiceRecordBar.hidden = true;
    mediaRecorder = null;
    voiceStream = null;
    resetVoiceUi();

    if (discard) {
      playRecordStopSound();
      rec.ondataavailable = null;
      rec.onstop = null;
      if (rec.state !== 'inactive') rec.stop();
      if (stream) stream.getTracks().forEach((t) => t.stop());
      voiceChunks = [];
      return;
    }

    playRecordStopSound();

    try {
      if (rec.state === 'recording') {
        rec.requestData();
      }
    } catch {}

    rec.onstop = async () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());

      if (!voiceChunks.length) {
        toast('Voice note was empty or too short');
        return;
      }

      const rawType = rec.mimeType || 'audio/webm';
      const cleanType = rawType.split(';')[0];
      const ext = cleanType.includes('mp4') ? 'mp4' : (cleanType.includes('ogg') ? 'ogg' : 'webm');
      const blob = new Blob(voiceChunks, { type: cleanType });
      voiceChunks = [];

      if (blob.size < 50) {
        toast('Voice note was too short');
        return;
      }

      const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: cleanType });
      await sendVoiceFile(file);
    };

    if (rec.state !== 'inactive') {
      rec.stop();
    }
  }

  async function sendVoiceFile(file) {
    if (!state.activeConversationId) return;
    toast('Uploading voice note…');
    try {
      const fd = new FormData();
      fd.append('media', file);
      const res = await fetch(`${BASE}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${state.token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload voice note');

      socket.emit('message', {
        conversationId: state.activeConversationId,
        text: '',
        mediaUrl: data.url,
        mediaType: 'audio',
        mediaName: 'Voice note',
      });
      playSendSound();
    } catch (err) {
      toast(err.message);
    }
  }

  if (el.voiceBtn) {
    el.voiceBtn.onclick = () => {
      if (el.voiceRecordBar.hidden) {
        startVoiceRecording();
      } else {
        stopVoiceRecording(false);
      }
    };
  }

  if (el.voicePauseBtn) {
    el.voicePauseBtn.onclick = toggleVoicePause;
  }

  if (el.voiceCancelBtn) {
    el.voiceCancelBtn.onclick = () => stopVoiceRecording(true);
  }

  if (el.voiceSendBtn) {
    el.voiceSendBtn.onclick = () => stopVoiceRecording(false);
  }

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

  /* ------------------------------------------------------------- friends & requests */
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
      renderAvatar(avatar, f.name, f.avatarColor, f.avatarUrl, f.isOnline);

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

      const unfriendBtn = document.createElement('button');
      unfriendBtn.type = 'button';
      unfriendBtn.className = 'btn-unfriend';
      unfriendBtn.title = `Unfriend ${f.name}`;
      unfriendBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg><span>Unfriend</span>';
      unfriendBtn.onclick = async (e) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to unfriend ${f.name}?`)) return;
        try {
          await api(`/api/friends/${f.id}`, { method: 'DELETE' });
          toast(`Unfriended ${f.name}`);
          state.friends = state.friends.filter((item) => item.id !== f.id);
          renderFriends();
          loadConversations();
        } catch (err) {
          toast(err.message || 'Could not unfriend');
        }
      };

      textDiv.append(topDiv, sub);
      li.append(avatar, textDiv, unfriendBtn);
      el.friendList.appendChild(li);
    }
  }

  if (el.tabMyFriends) {
    el.tabMyFriends.onclick = () => {
      el.tabMyFriends.classList.add('active');
      el.tabFriendRequests.classList.remove('active');
      el.friendList.hidden = false;
      el.requestsList.hidden = true;
    };
  }

  if (el.tabFriendRequests) {
    el.tabFriendRequests.onclick = () => {
      el.tabFriendRequests.classList.add('active');
      el.tabMyFriends.classList.remove('active');
      el.friendList.hidden = true;
      el.requestsList.hidden = false;
      loadFriendRequests();
    };
  }

  async function loadFriendRequests() {
    try {
      const data = await api('/api/friends/requests');
      state.friendRequests = data.requests || [];
      renderFriendRequests();
      const count = state.friendRequests.length;
      if (el.requestsBadge) {
        el.requestsBadge.textContent = count;
        el.requestsBadge.hidden = count === 0;
      }
      if (el.navFriendsBadge) {
        el.navFriendsBadge.textContent = count;
        el.navFriendsBadge.hidden = count === 0;
      }
    } catch (err) {
      console.error('loadFriendRequests error:', err);
    }
  }

  function renderFriendRequests() {
    if (!el.requestsList) return;
    el.requestsList.replaceChildren();

    if (!state.friendRequests.length) {
      const empty = document.createElement('li');
      empty.className = 'panel-title';
      empty.style.padding = '1.25rem 0.75rem';
      empty.style.textAlign = 'center';
      empty.textContent = 'No pending friend requests';
      el.requestsList.appendChild(empty);
      return;
    }

    for (const req of state.friendRequests) {
      const li = document.createElement('li');
      li.className = 'req-item';

      const userDiv = document.createElement('div');
      userDiv.className = 'req-user-info';

      const avatar = document.createElement('span');
      avatar.style.width = '36px';
      avatar.style.height = '36px';
      avatar.style.minWidth = '36px';
      renderAvatar(avatar, req.name, req.avatarColor, req.avatarUrl);

      const textDiv = document.createElement('div');
      textDiv.style.minWidth = '0';
      textDiv.style.flex = '1';

      const name = document.createElement('div');
      name.className = 'req-name';
      name.textContent = req.name;

      const phone = document.createElement('div');
      phone.className = 'req-phone';
      phone.textContent = req.phone;

      textDiv.append(name, phone);
      userDiv.append(avatar, textDiv);

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'req-actions';

      const acceptBtn = document.createElement('button');
      acceptBtn.type = 'button';
      acceptBtn.className = 'req-btn accept';
      acceptBtn.textContent = 'Accept';
      acceptBtn.onclick = () => acceptFriendRequest(req.id);

      const declineBtn = document.createElement('button');
      declineBtn.type = 'button';
      declineBtn.className = 'req-btn decline';
      declineBtn.textContent = 'Decline';
      declineBtn.onclick = () => declineFriendRequest(req.id);

      actionsDiv.append(acceptBtn, declineBtn);
      li.append(userDiv, actionsDiv);
      el.requestsList.appendChild(li);
    }
  }

  async function acceptFriendRequest(reqId) {
    try {
      const data = await api(`/api/friends/requests/${reqId}/accept`, { method: 'POST' });
      toast(`You and ${data.friend ? data.friend.name : 'your friend'} are now friends!`);
      loadFriendRequests();
      loadFriends();
      loadConversations();
    } catch (err) {
      toast(err.message);
    }
  }

  async function declineFriendRequest(reqId) {
    try {
      await api(`/api/friends/requests/${reqId}/decline`, { method: 'POST' });
      toast('Friend request declined');
      loadFriendRequests();
    } catch (err) {
      toast(err.message);
    }
  }

  async function sendFriendRequest(phone) {
    try {
      const data = await api('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      toast(data.message || 'Friend request sent!');
      loadFriends();
      loadFriendRequests();
      return true;
    } catch (err) {
      toast(err.message);
      return false;
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
      if (err.data && err.data.requiresFriendRequest) {
        toast('Friend request required to talk.');
        sendFriendRequest(phone);
      } else {
        toast(err.message);
      }
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

  /* ------------------------------------------------------------- group friends picker */
  function renderGroupFriendsPicker(filterText = '') {
    if (!el.groupFriendsList) return;
    el.groupFriendsList.replaceChildren();
    const q = (filterText || '').toLowerCase().trim();

    if (!state.friends || !state.friends.length) {
      const empty = document.createElement('div');
      empty.className = 'picker-empty';
      empty.textContent = 'You have no friends yet. Add friends first to create a group.';
      el.groupFriendsList.appendChild(empty);
      return;
    }

    const filtered = state.friends.filter((f) => {
      return !q || f.name.toLowerCase().includes(q) || f.phone.includes(q);
    });

    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'picker-empty';
      empty.textContent = `No friends match "${escapeHtml(filterText)}"`;
      el.groupFriendsList.appendChild(empty);
      return;
    }

    filtered.forEach((friend) => {
      const label = document.createElement('label');
      label.className = 'group-friend-row';

      const check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'group-friend-check';
      check.value = friend.phone;
      check.checked = state.selectedGroupFriends.has(friend.phone);

      check.onchange = () => {
        if (check.checked) {
          state.selectedGroupFriends.add(friend.phone);
        } else {
          state.selectedGroupFriends.delete(friend.phone);
        }
        if (el.groupFriendsCount) {
          el.groupFriendsCount.textContent = `${state.selectedGroupFriends.size} selected`;
        }
      };

      const avatar = document.createElement('span');
      avatar.className = 'avatar small';
      renderAvatar(avatar, friend.name, friend.avatarColor, friend.avatarUrl);

      const info = document.createElement('div');
      info.className = 'group-friend-info';
      const name = document.createElement('span');
      name.className = 'group-friend-name';
      name.textContent = friend.name;
      const phone = document.createElement('span');
      phone.className = 'group-friend-phone';
      phone.textContent = friend.phone;
      info.append(name, phone);

      label.append(check, avatar, info);
      el.groupFriendsList.appendChild(label);
    });
  }

  if (el.groupFriendsSearch) {
    el.groupFriendsSearch.oninput = () => renderGroupFriendsPicker(el.groupFriendsSearch.value);
  }

  el.newChatBtn.onclick = () => {
    el.dmError.textContent = '';
    el.groupError.textContent = '';
    if (el.tabNewGroup.classList.contains('active')) {
      renderGroupFriendsPicker(el.groupFriendsSearch ? el.groupFriendsSearch.value : '');
    }
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
    state.selectedGroupFriends.clear();
    if (el.groupFriendsCount) el.groupFriendsCount.textContent = '0 selected';
    if (el.groupFriendsSearch) el.groupFriendsSearch.value = '';
    renderGroupFriendsPicker();
  };

  el.dmForm.onsubmit = async (e) => {
    e.preventDefault();
    el.dmError.replaceChildren();
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
      if (err.data && err.data.requiresFriendRequest) {
        const span = document.createElement('span');
        span.textContent = `${err.message} `;
        const reqBtn = document.createElement('button');
        reqBtn.type = 'button';
        reqBtn.className = 'btn-text';
        reqBtn.style.color = 'var(--accent)';
        reqBtn.style.fontWeight = '700';
        reqBtn.textContent = 'Send Friend Request';
        reqBtn.onclick = async () => {
          reqBtn.disabled = true;
          reqBtn.textContent = 'Sending…';
          const ok = await sendFriendRequest(el.dmPhone.value.trim());
          if (ok) el.newChatDialog.close();
        };
        el.dmError.append(span, reqBtn);
      } else {
        el.dmError.textContent = err.message;
      }
    }
  };

  el.groupForm.onsubmit = async (e) => {
    e.preventDefault();
    el.groupError.textContent = '';
    try {
      const name = el.groupName.value.trim();
      const phones = Array.from(state.selectedGroupFriends);

      if (!name) {
        el.groupError.textContent = 'Please enter a group name';
        return;
      }
      if (!phones.length) {
        el.groupError.textContent = 'Please select at least one friend to add to the group.';
        return;
      }

      const data = await api('/api/conversations/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phones }),
      });

      el.groupName.value = '';
      state.selectedGroupFriends.clear();
      if (el.groupFriendsCount) el.groupFriendsCount.textContent = '0 selected';
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
      const data = await api('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      el.friendPhone.value = '';
      el.addFriendDialog.close();
      toast(data.message || 'Friend request sent!');
      loadFriends();
      loadFriendRequests();
    } catch (err) {
      el.friendError.textContent = err.message;
    }
  };

  /* ------------------------------------------------------------- delete conversation ("delete for me") */
  if (el.convMoreBtn) {
    el.convMoreBtn.onclick = (e) => {
      e.stopPropagation();
      const willOpen = el.convDropdown ? el.convDropdown.hidden : false;
      closeAllDropdowns();
      if (el.convDropdown && willOpen) {
        el.convDropdown.hidden = false;
      }
    };
  }

  if (el.deleteConvBtn) {
    el.deleteConvBtn.onclick = (e) => {
      e.stopPropagation();
      closeAllDropdowns();
      if (!state.activeConversationId) return;
      el.deleteConvDialog.showModal();
    };
  }

  if (el.confirmDeleteConvBtn) {
    el.confirmDeleteConvBtn.onclick = async () => {
      if (!state.activeConversationId) return;
      const convId = state.activeConversationId;
      try {
        await api(`/api/conversations/${convId}`, { method: 'DELETE' });
        toast('Conversation deleted for you.');
        el.deleteConvDialog.close();

        state.activeConversationId = null;
        if (el.convMoreWrap) el.convMoreWrap.hidden = true;
        if (el.convDropdown) el.convDropdown.hidden = true;
        el.manageGroupBtn.hidden = true;
        el.convTitle.textContent = 'Select a conversation';
        el.convSub.textContent = 'or start a new chat';
        renderAvatar(el.convAvatar, '#', 0, null);
        el.input.disabled = true;
        el.send.disabled = true;
        el.messages.replaceChildren();
        el.emptyState.hidden = false;
        el.emptyTitle.textContent = 'Conversation deleted';
        el.emptyText.textContent = 'Select a chat from the sidebar or click + to start messaging.';

        await loadConversations();
      } catch (err) {
        toast(err.message);
      }
    };
  }

  /* ------------------------------------------------------------- profile edit modal */
  let profileSelectedColor = 0;
  let profileAvatarUrl = null;

  function openProfileDialog() {
    if (!state.user) return;
    profileSelectedColor = state.user.avatar_color || 0;
    profileAvatarUrl = state.user.avatar_url || null;

    el.profileName.value = state.user.name || '';
    el.profilePassword.value = '';
    el.profileError.textContent = '';

    renderProfileAvatarPreview();
    renderAvatarPalette();
    el.profileDialog.showModal();
  }

  function renderProfileAvatarPreview() {
    renderAvatar(el.profileAvatarPreview, el.profileName.value || state.user.name, profileSelectedColor, profileAvatarUrl);
    if (el.profileRemovePicBtn) {
      el.profileRemovePicBtn.hidden = !profileAvatarUrl;
    }
  }

  function renderAvatarPalette() {
    el.avatarPalette.replaceChildren();
    for (let i = 0; i < 10; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `palette-color-btn avatar c-${i} ${profileSelectedColor === i ? 'selected' : ''}`;
      btn.textContent = (el.profileName.value || state.user.name || '?').charAt(0).toUpperCase();
      btn.onclick = () => {
        profileSelectedColor = i;
        renderAvatarPalette();
        renderProfileAvatarPreview();
      };
      el.avatarPalette.appendChild(btn);
    }
  }

  if (el.meInfo) {
    el.meInfo.onclick = (e) => {
      if (e.target.closest('#logout-btn') || e.target.closest('#notif-btn') || e.target.closest('#theme-btn')) return;
      openProfileDialog();
    };
  }

  if (el.editProfileBtn) {
    el.editProfileBtn.onclick = (e) => {
      e.stopPropagation();
      openProfileDialog();
    };
  }

  if (el.profileUploadTrigger) {
    el.profileUploadTrigger.onclick = () => el.profilePicInput.click();
  }

  if (el.profilePicInput) {
    el.profilePicInput.onchange = async () => {
      const file = el.profilePicInput.files && el.profilePicInput.files[0];
      if (!file) return;
      toast('Uploading profile photo…');
      try {
        const fd = new FormData();
        fd.append('media', file);
        const res = await fetch(`${BASE}/api/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${state.token}` },
          body: fd,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to upload photo');
        profileAvatarUrl = data.url;
        renderProfileAvatarPreview();
        toast('Photo uploaded! Click Save Changes to apply.');
      } catch (err) {
        toast(err.message);
      }
    };
  }

  if (el.profileRemovePicBtn) {
    el.profileRemovePicBtn.onclick = () => {
      profileAvatarUrl = null;
      renderProfileAvatarPreview();
    };
  }

  if (el.profileForm) {
    el.profileForm.onsubmit = async (e) => {
      e.preventDefault();
      el.profileError.textContent = '';
      el.profileSaveBtn.disabled = true;

      try {
        const name = el.profileName.value.trim();
        const password = el.profilePassword.value;
        const payload = {
          name,
          avatarColor: profileSelectedColor,
          avatarUrl: profileAvatarUrl,
        };
        if (password) payload.password = password;

        const data = await api('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        state.user = data.user;
        el.meName.textContent = data.user.name;
        renderAvatar(el.meAvatar, data.user.name, data.user.avatar_color, data.user.avatar_url);

        el.profileDialog.close();
        toast('Profile updated successfully!');
      } catch (err) {
        el.profileError.textContent = err.message;
      } finally {
        el.profileSaveBtn.disabled = false;
      }
    };
  }

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
        const roleWrap = document.createElement('div');
        roleWrap.style.display = 'flex';
        roleWrap.style.alignItems = 'center';
        roleWrap.style.gap = '6px';

        const roleBadge = document.createElement('span');
        roleBadge.className = `role-badge ${u.isAdmin ? 'role-admin' : 'role-user'}`;
        roleBadge.textContent = u.isAdmin ? 'Admin' : 'User';
        roleWrap.appendChild(roleBadge);

        if (u.id !== state.user.id) {
          const roleBtn = document.createElement('button');
          roleBtn.type = 'button';
          roleBtn.className = `btn-role-toggle ${u.isAdmin ? 'demote' : 'promote'}`;
          roleBtn.textContent = u.isAdmin ? 'Demote' : 'Make Admin';
          roleBtn.title = u.isAdmin ? 'Demote to regular user' : 'Promote to administrator';
          roleBtn.onclick = async () => {
            try {
              await api(`/api/admin/users/${u.id}/role`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isAdmin: !u.isAdmin }),
              });
              toast(`User ${!u.isAdmin ? 'promoted to Admin' : 'demoted to User'}`);
              loadAdminUsers();
              loadAdminStats();
            } catch (err) {
              toast(err.message);
            }
          };
          roleWrap.appendChild(roleBtn);
        }
        tdRole.appendChild(roleWrap);

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

    function renderAuditHeader() {
      el.auditThreadHeader.replaceChildren();
      const titleSpan = document.createElement('span');
      titleSpan.textContent = `Auditing: ${conv.name} (${conv.totalMessages} total, ${conv.deletedMessages} deleted by users)`;
      el.auditThreadHeader.appendChild(titleSpan);

      if (conv.deletedMessages > 0) {
        const purgeAllBtn = document.createElement('button');
        purgeAllBtn.type = 'button';
        purgeAllBtn.className = 'audit-purge-all-btn';
        purgeAllBtn.innerHTML = '<svg viewBox="0 0 24 24" class="btn-icon" aria-hidden="true" style="width:13px;height:13px;display:inline-block;vertical-align:-2px;margin-right:4px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>Purge All Deleted';
        purgeAllBtn.onclick = async () => {
          if (!confirm(`Permanently delete all ${conv.deletedMessages} deleted messages in "${conv.name}"? This cannot be undone.`)) {
            return;
          }
          try {
            const res = await api(`/api/admin/conversations/${conv.id}/purge-deleted`, { method: 'DELETE' });
            toast(`Purged ${res.purgedCount || conv.deletedMessages} deleted messages.`);
            conv.totalMessages = Math.max(0, conv.totalMessages - (res.purgedCount || conv.deletedMessages));
            conv.deletedMessages = 0;
            loadConversationAuditLog(conv);
            loadAdminStats();
            loadAdminConversations();
          } catch (err) {
            toast(err.message);
          }
        };
        el.auditThreadHeader.appendChild(purgeAllBtn);
      }
    }

    renderAuditHeader();

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
        header.style.display = 'flex';
        header.style.alignItems = 'center';
        header.style.flexWrap = 'wrap';
        header.style.gap = '6px';
        header.innerHTML = `<strong>${m.senderName}</strong> (${m.senderPhone || 'ID:' + m.senderId}) • ${new Date(
          m.ts
        ).toLocaleString()}`;

        if (m.isDeleted) {
          const badge = document.createElement('span');
          badge.className = 'audit-deleted-badge';
          badge.textContent = 'DELETED BY USER';
          header.appendChild(badge);

          const purgeBtn = document.createElement('button');
          purgeBtn.type = 'button';
          purgeBtn.className = 'audit-purge-btn';
          purgeBtn.title = 'Permanently delete this message from the database';
          purgeBtn.innerHTML = '<svg viewBox="0 0 24 24" class="btn-icon" aria-hidden="true" style="width:12px;height:12px;display:inline-block;vertical-align:-1px;margin-right:3px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>Permanently Delete';
          purgeBtn.onclick = async (e) => {
            e.stopPropagation();
            if (!confirm('Are you sure you want to PERMANENTLY delete this message from the database? This cannot be undone.')) {
              return;
            }
            try {
              await api(`/api/admin/messages/${m.id}/purge`, { method: 'DELETE' });
              toast('Message permanently purged from database.');
              li.remove();
              conv.deletedMessages = Math.max(0, (conv.deletedMessages || 1) - 1);
              conv.totalMessages = Math.max(0, (conv.totalMessages || 1) - 1);
              renderAuditHeader();
              loadAdminStats();
            } catch (err) {
              toast(err.message);
            }
          };
          header.appendChild(purgeBtn);
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
    updateMenuButton();
  }

  function closeRail() {
    el.app.classList.remove('rail-open');
    el.scrim.hidden = true;
    el.menuBtn.setAttribute('aria-expanded', 'false');
    updateMenuButton();
  }

  function updateMenuButton() {
    if (!el.menuBtn) return;
    el.menuBtn.innerHTML = '<svg class="brand-mark menu-brand-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
    el.menuBtn.setAttribute('title', 'Toggle navigation');
    el.menuBtn.setAttribute('aria-label', 'Toggle navigation');
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
    updateMenuButton();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDropdowns();
      if (state.replyTarget) cancelReply();
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.msg-menu-wrap') && !e.target.closest('.chat-item-menu-wrap') && !e.target.closest('.conv-more-wrap')) {
      closeAllDropdowns();
    }
  });

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('chatbox.theme', next);
    paintTheme();
  }

  function paintTheme() {
    const isDark = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark';
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

  const claimAdminBtn = $('claim-admin-btn');
  if (claimAdminBtn) {
    claimAdminBtn.onclick = async () => {
      try {
        const input = $('claim-admin-code');
        const code = input ? input.value.trim() : '';
        const res = await api('/api/auth/claim-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        if (state.user) state.user.is_admin = true;
        el.navAdmin.hidden = false;
        toast(res.message || 'You are now an administrator!');
        if (input) input.value = '';
      } catch (err) {
        toast(err.message);
      }
    };
  }

  /* ------------------------------------------------------------- init */
  if (!document.documentElement.getAttribute('data-theme')) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  paintTheme();
  initEmojiPicker();
  checkInitialAuth();
})();
