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
    authCountry: $('auth-country'),
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
    convInfoBtn: $('conv-info-btn'),
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

    editPreviewBar: $('edit-preview-bar'),
    editBarTitle: $('edit-bar-title'),
    editBarSnippet: $('edit-bar-snippet'),
    editCancel: $('edit-cancel'),

    emojiBtn: $('emoji-btn'),
    emojiPicker: $('emoji-picker'),

    newChatDialog: $('new-chat-dialog'),
    tabNewDm: $('tab-new-dm'),
    tabNewGroup: $('tab-new-group'),
    dmForm: $('dm-form'),
    dmCountry: $('dm-country'),
    dmPhone: $('dm-phone'),
    dmError: $('dm-error'),
    groupForm: $('group-form'),
    groupName: $('group-name'),
    groupMembers: $('group-members'),
    groupError: $('group-error'),

    addFriendDialog: $('add-friend-dialog'),
    friendForm: $('friend-form'),
    friendCountry: $('friend-country'),
    friendPhone: $('friend-phone'),
    friendError: $('friend-error'),

    groupMembersDialog: $('group-members-dialog'),
    groupAvatarPreview: $('group-avatar-preview'),
    groupPicInput: $('group-pic-input'),
    groupUploadTrigger: $('group-upload-trigger'),
    groupRemovePicBtn: $('group-remove-pic-btn'),
    addMemberForm: $('add-member-form'),
    newMemberCountry: $('new-member-country'),
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
    lightboxVideo: $('lightbox-video'),
    lightboxDownloadBtn: $('lightbox-download-btn'),
    lightboxClose: $('lightbox-close'),
    lightboxPrev: $('lightbox-prev'),
    lightboxNext: $('lightbox-next'),
    lightboxGalleryWrap: $('lightbox-gallery-wrap'),
    lightboxGallery: $('lightbox-gallery'),

    // Chat Info Sidepanel & Shared Media Browser (Telegram-style)
    chatInfoPanel: $('chat-info-panel'),
    infoPanelScrim: $('info-panel-scrim'),
    infoPanelMain: $('info-panel-main'),
    infoPanelMediaView: $('info-panel-media-view'),
    infoPanelClose: $('info-panel-close'),
    infoMediaClose: $('info-media-close'),
    infoMediaBack: $('info-media-back'),
    infoMediaTitle: $('info-media-title'),
    infoMediaContent: $('info-media-content'),
    infoAvatar: $('info-avatar'),
    infoName: $('info-name'),
    infoStatus: $('info-status'),
    infoPhoneText: $('info-phone-text'),
    infoPhoneLabel: $('info-phone-label'),
    infoGroupDescWrap: $('info-group-desc-wrap'),
    infoGroupDescText: $('info-group-desc-text'),
    infoRowPhotos: $('info-row-photos'),
    infoRowVideos: $('info-row-videos'),
    infoRowFiles: $('info-row-files'),
    infoRowVoice: $('info-row-voice'),
    infoCountPhotos: $('info-count-photos'),
    infoCountVideos: $('info-count-videos'),
    infoCountFiles: $('info-count-files'),
    infoCountVoice: $('info-count-voice'),
    infoActShare: $('info-act-share'),
    infoActDeleteChat: $('info-act-delete-chat'),
    infoActBlock: $('info-act-block'),
    infoBlockText: $('info-block-text'),

    adminDialog: $('admin-dialog'),
    statUsers: $('stat-users'),
    statOnline: $('stat-online'),
    statMessages: $('stat-messages'),
    adminUsersTbody: $('admin-users-tbody'),

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
    editingTarget: null,
    typers: new Map(),
    notificationsEnabled: typeof Notification !== 'undefined' && Notification.permission === 'granted',
    selectionMode: false,
    selectedMessageIds: new Set(),
    selectedForwardTargets: new Set(),
    selectedGroupFriends: new Set(),
    messagesCache: new Map(),
  };

  let socket = null;

  function normalizeMediaUrl(url) {
    if (!url) return '';
    if (url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    // Any uploaded file must route via ${BASE}/static/uploads/<filename> regardless of origin/scheme
    if (url.includes('/static/uploads/')) {
      const filename = url.split('/static/uploads/')[1].split('?')[0];
      return `${BASE || ''}/static/uploads/${filename}`;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/static/')) {
      return `${BASE || ''}${url}`;
    }
    return url;
  }

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

  // Message deletion sound: crisp, satisfying pop
  function playDeletePopSound() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(820, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.11);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
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
      img.src = normalizeMediaUrl(avatarUrl);
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

  /* ------------------------------------------------------------- phone & country normalization */
  function getNormalizedPhone(countrySelect, phoneInput) {
    if (!phoneInput) return '';
    let raw = (phoneInput.value || '').trim();
    const country = countrySelect ? countrySelect.value : '+880';

    // If string already contains BD country code
    if (raw.startsWith('+880')) {
      raw = raw.slice(4);
    } else if (raw.startsWith('880')) {
      raw = raw.slice(3);
    }

    // Keep only digits
    let digits = raw.replace(/[^\d]/g, '');

    // For Bangladesh (+880) or 10-11 digit numbers starting with 01 / 1
    if (country === '+880' || digits.startsWith('01') || (digits.startsWith('1') && digits.length === 10)) {
      if (digits.startsWith('1') && digits.length === 10) {
        digits = '0' + digits;
      }
      return digits.slice(0, 11);
    }

    if (raw.startsWith('+')) {
      return '+' + digits;
    }
    return country ? `${country}${digits}` : digits;
  }

  function setupCountryPhoneInput(countrySelect, phoneInput) {
    if (!phoneInput) return;

    function applyFormat() {
      const countryCode = countrySelect ? countrySelect.value : '+880';
      const opt = countrySelect ? countrySelect.selectedOptions[0] : null;
      const maxLen = opt && opt.dataset.max ? parseInt(opt.dataset.max, 10) : 11;

      if (countryCode === '+880') {
        phoneInput.placeholder = '01XXXXXXXXX';
        phoneInput.maxLength = 11;
      } else {
        phoneInput.placeholder = 'Phone number';
        phoneInput.maxLength = maxLen;
      }
    }

    if (countrySelect) {
      countrySelect.addEventListener('change', () => {
        applyFormat();
        phoneInput.focus();
      });
      applyFormat();
    }

    phoneInput.addEventListener('input', () => {
      let val = phoneInput.value;
      if (val.startsWith('+880')) {
        if (countrySelect) countrySelect.value = '+880';
        val = '0' + val.slice(4).replace(/[^\d]/g, '');
        phoneInput.value = val.slice(0, 11);
      } else if (val.startsWith('8801')) {
        if (countrySelect) countrySelect.value = '+880';
        val = '0' + val.slice(3).replace(/[^\d]/g, '');
        phoneInput.value = val.slice(0, 11);
      } else {
        phoneInput.value = val.replace(/[^\d]/g, '');
      }
    });
  }

  setupCountryPhoneInput(el.authCountry, el.authPhone);
  setupCountryPhoneInput(el.dmCountry, el.dmPhone);
  setupCountryPhoneInput(el.friendCountry, el.friendPhone);
  setupCountryPhoneInput(el.newMemberCountry, el.newMemberPhone);

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

    const phone = getNormalizedPhone(el.authCountry, el.authPhone);
    const password = el.authPassword.value;
    const name = el.authName.value.trim();

    const countryCode = el.authCountry ? el.authCountry.value : '+880';
    if (countryCode === '+880') {
      if (!/^01[3-9]\d{8}$/.test(phone)) {
        el.authError.textContent = 'Please enter a valid 11-digit Bangladeshi phone number (e.g. 017XXXXXXXX)';
        el.authError.hidden = false;
        return;
      }
    } else if (!phone || phone.length < 5) {
      el.authError.textContent = 'Please enter a valid phone number';
      el.authError.hidden = false;
      return;
    }

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

    socket.on('group_avatar_updated', ({ conversationId, avatarUrl }) => {
      const conv = state.conversations.find((c) => c.id === conversationId);
      if (conv) {
        conv.avatarUrl = avatarUrl;
        renderConversations();
        if (state.activeConversationId === conversationId) {
          if (avatarUrl) {
            renderAvatar(el.convAvatar, conv.name, conv.avatarColor || 0, avatarUrl, false);
          } else {
            el.convAvatar.className = `avatar c-${conv.avatarColor || 0}`;
            el.convAvatar.textContent = '👥';
          }
          if (el.groupMembersDialog && el.groupMembersDialog.open) {
            renderGroupAvatarPreview();
          }
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
      removeMessageRow(id);
    });

    socket.on('message_edited', ({ id, conversationId, text, isEdited }) => {
      const cached = state.messagesCache.get(id);
      if (cached) {
        cached.text = text;
        cached.isEdited = isEdited;
      }
      const row = $(`msg-${id}`);
      if (row) {
        const textEl = row.querySelector('.bubble-text');
        if (textEl) {
          textEl.innerHTML = formatMessageText(text);
        }
        const metaEl = row.querySelector('.bubble-meta');
        if (metaEl && !metaEl.querySelector('.msg-edited-badge')) {
          const badge = document.createElement('span');
          badge.className = 'msg-edited-badge';
          badge.textContent = 'edited';
          metaEl.prepend(badge);
        }
      }
      const conv = state.conversations.find((c) => c.id === conversationId);
      if (conv && conv.lastMessage && conv.lastMessage.ts && cached && conv.lastMessage.ts === cached.ts) {
        conv.lastMessage.text = text;
        renderConversations();
      }
    });

    socket.on('message_reaction_updated', ({ messageId, conversationId, reactions }) => {
      const cached = state.messagesCache.get(messageId);
      if (cached) {
        cached.reactions = reactions;
      }
      renderMessageReactions(messageId, reactions);
    });

    socket.on('media_restored', ({ filename, url }) => {
      const normalized = normalizeMediaUrl(url);
      document.querySelectorAll('img, video, audio').forEach((mediaEl) => {
        if (mediaEl.src && mediaEl.src.includes(filename)) {
          mediaEl.src = `${normalized}?t=${Date.now()}`;
          mediaEl.classList.remove('media-broken');
        }
      });
      if (currentLightboxMedia && currentLightboxMedia.url && currentLightboxMedia.url.includes(filename)) {
        if (el.lightboxImg) {
          el.lightboxImg.src = `${normalized}?t=${Date.now()}`;
          el.lightboxImg.classList.remove('media-broken');
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

    socket.on('account_deleted', () => {
      toast('Your account was deleted by an administrator.');
      logout();
    });

    socket.on('user_deleted', () => {
      loadConversations();
      loadFriends();
      if (state.user && state.user.is_admin) {
        loadAdminUsers();
        loadAdminStats();
      }
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
    document.querySelectorAll('.msg-reaction-bar:not([hidden])').forEach((r) => (r.hidden = true));
    document.querySelectorAll('.msg-react-btn.active').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.msg-row.show-menu').forEach((r) => r.classList.remove('show-menu'));
    document.querySelectorAll('.chat-item-dropdown:not([hidden])').forEach((d) => (d.hidden = true));
    document.querySelectorAll('.chat-item-down-btn.active').forEach((b) => b.classList.remove('active'));
    closeReactionPicker();
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
        if (conv.avatarUrl) {
          renderAvatar(avatar, conv.name, conv.avatarColor || 0, conv.avatarUrl, false);
        } else {
          avatar.className = `avatar c-${conv.avatarColor || 0}`;
          avatar.textContent = '👥';
        }
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
    cancelEdit();
    clearMediaSelection();

    const conv = state.conversations.find((c) => c.id === convId);
    if (!conv) return;

    renderConversations();

    // Setup Header
    el.convTitle.textContent = conv.name;
    if (conv.type === 'group') {
      if (conv.avatarUrl) {
        renderAvatar(el.convAvatar, conv.name, conv.avatarColor || 0, conv.avatarUrl, false);
      } else {
        el.convAvatar.className = `avatar c-${conv.avatarColor || 0}`;
        el.convAvatar.textContent = '👥';
      }
      el.convSub.textContent = `${conv.memberCount} members`;
      el.manageGroupBtn.hidden = false;
      if (el.convInfoBtn) el.convInfoBtn.hidden = true;
    } else {
      renderAvatar(el.convAvatar, conv.name, conv.avatarColor, conv.avatarUrl, conv.isOnline);
      el.convSub.textContent = `${conv.phone} • ${conv.isOnline ? 'Online' : 'Offline'}`;
      el.manageGroupBtn.hidden = true;
      if (el.convInfoBtn) el.convInfoBtn.hidden = false;
    }
    closeChatInfoPanel();
    if (el.convDropdown) el.convDropdown.hidden = true;
    if (el.deleteConvBtn) el.deleteConvBtn.hidden = false;

    el.input.disabled = false;
    el.send.disabled = false;
    el.input.placeholder = 'Type a message…';
    adjustInputHeight();

    // Join room on socket and mark conversation as seen
    if (socket) {
      socket.emit('join_conversation', { conversationId: convId });
      socket.emit('conversation_seen', { conversationId: convId });
    }

    // Load message history
    try {
      const data = await api(`/api/conversations/${convId}/messages`);
      const msgs = data.messages || [];
      renderMessages(msgs);
      // Auto-repair any missing media if cached in this browser
      msgs.forEach((m) => {
        const list = m.mediaList || (m.mediaUrl ? [{ url: m.mediaUrl, missing: m.mediaMissing }] : []);
        list.forEach((it) => {
          if (it && it.missing) {
            repairIfCached(it);
          }
        });
      });
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

  function removeMessageRow(id) {
    playDeletePopSound();
    state.messagesCache.delete(id);
    if (state.selectedMessageIds.has(id)) {
      state.selectedMessageIds.delete(id);
      updateSelectionBar();
    }
    const row = $(`msg-${id}`);
    if (row) {
      row.classList.add('pop-deleting');
      setTimeout(() => {
        row.remove();
        if (el.messages && el.messages.children.length === 0) {
          el.emptyState.hidden = false;
        }
      }, 240);
    }
  }

  async function downloadMediaFile(url, defaultName) {
    if (!url) return;
    const finalUrl = normalizeMediaUrl(url);
    try {
      toast('Downloading media…');
      const response = await fetch(finalUrl);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = blobUrl;
      let filename = defaultName || '';
      if (!filename || filename === 'Photo' || filename === 'Video' || filename === 'Voice note' || filename === 'Media') {
        const ext = finalUrl.split('.').pop().split('?')[0] || 'bin';
        filename = `chatbox-${Date.now()}.${ext}`;
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    } catch {
      const a = document.createElement('a');
      a.href = finalUrl;
      a.download = defaultName || 'download';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  const repairingMediaSet = new Set();
  function repairIfCached(item, fallbackImg) {
    if (!item || !item.url) return;
    const url = normalizeMediaUrl(item.url);
    if (!url.includes('/static/uploads/')) return;
    const filename = url.split('/static/uploads/')[1].split('?')[0];
    if (!filename || repairingMediaSet.has(filename)) return;
    repairingMediaSet.add(filename);

    const tryUploadBlob = async (blob) => {
      if (!blob || blob.size === 0) return false;
      const fd = new FormData();
      fd.append('filename', filename);
      fd.append('media', blob, filename);
      const res = await fetch(`${BASE}/api/media/repair`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${state.token}` },
        body: fd,
      });
      if (res.ok) {
        item.missing = false;
        return true;
      }
      return false;
    };

    // Attempt 1: Fetch from browser cache
    fetch(url, { cache: 'force-cache' })
      .then((r) => {
        if (!r.ok) throw new Error('Not in HTTP cache');
        return r.blob();
      })
      .then(async (blob) => {
        const ok = await tryUploadBlob(blob);
        if (!ok) throw new Error('Blob upload failed');
      })
      .catch(async () => {
        // Attempt 2: If browser rendered image via DOM cache, draw to canvas
        if (fallbackImg && fallbackImg.complete && fallbackImg.naturalWidth > 0) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = fallbackImg.naturalWidth;
            canvas.height = fallbackImg.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(fallbackImg, 0, 0);
            canvas.toBlob(async (blob) => {
              if (blob) await tryUploadBlob(blob);
            }, 'image/jpeg', 0.95);
          } catch (e) {
            repairingMediaSet.delete(filename);
          }
        } else {
          repairingMediaSet.delete(filename);
        }
      });
  }

  function appendMessage(msg, isLastInCluster = true) {
    el.emptyState.hidden = true;
    state.messagesCache.set(msg.id, msg);

    // If replacing an optimistic uploading row
    let existingOptRow = null;
    if (msg.tempId) {
      existingOptRow = $(`msg-${msg.tempId}`);
      if (existingOptRow) {
        const cached = state.messagesCache.get(msg.tempId);
        if (cached && Array.isArray(cached.blobUrls)) {
          setTimeout(() => {
            cached.blobUrls.forEach((u) => { try { URL.revokeObjectURL(u); } catch (e) {} });
          }, 60000);
        }
        state.messagesCache.delete(msg.tempId);
      }
    }

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
      if (existingOptRow) {
        existingOptRow.replaceWith(li);
      } else {
        el.messages.appendChild(li);
      }
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
      const rawSnippet = msg.replyToText || msg.reply_to_text || 'Original message';
      const cleanSnippet = typeof rawSnippet === 'string'
        ? rawSnippet.trim().replace(/\r\n/g, '\n').replace(/\n\s*\n+/g, '\n')
        : 'Original message';
      quoteDiv.innerHTML = `
        <div class="msg-reply-body">
          <span class="msg-reply-author">${escapeHtml(replyAuthor)}</span>
          <span class="msg-reply-snippet">${escapeHtml(cleanSnippet)}</span>
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

    // Media Handling: Multiple Media Collage or Single Media
    const rawMediaList = Array.isArray(msg.mediaList) && msg.mediaList.length > 0
      ? msg.mediaList
      : (msg.mediaUrl || msg.media_url ? [{
          url: msg.mediaUrl || msg.media_url,
          mediaType: msg.mediaType || msg.media_type,
          mediaName: msg.mediaName || msg.media_name,
        }] : []);

    const isUploading = msg.status === 'uploading';

    if (rawMediaList.length > 1) {
      if (!msg.text) {
        bubble.classList.add('has-media-only');
      } else {
        bubble.classList.add('has-media');
      }

      const collage = document.createElement('div');
      const count = rawMediaList.length;
      if (count === 2) {
        collage.className = 'msg-media-collage collage-2';
      } else if (count === 3) {
        collage.className = 'msg-media-collage collage-3';
      } else {
        collage.className = 'msg-media-collage collage-4';
      }

      if (isUploading) {
        collage.classList.add('uploading-skeleton');
      }

      const displayItems = rawMediaList.slice(0, 4);
      const remaining = count - 4;

      displayItems.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'collage-item';

        const rawType = (item.mediaType || '').toLowerCase();
        const isVid = rawType === 'video' || rawType.startsWith('video/') || /\.(mp4|mov|mkv)(\?|$)/i.test(item.url);

        if (isVid) {
          const video = document.createElement('video');
          video.src = normalizeMediaUrl(item.url);
          video.preload = 'metadata';
          video.muted = true;
          itemEl.appendChild(video);

          const badge = document.createElement('div');
          badge.className = 'collage-video-badge';
          badge.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg> Video';
          itemEl.appendChild(badge);
        } else {
          const img = document.createElement('img');
          img.src = normalizeMediaUrl(item.url);
          img.alt = item.mediaName || 'Photo';
          img.loading = 'lazy';
          img.onload = () => {
            if (item.missing) repairIfCached(item, img);
          };
          img.onerror = () => {
            img.classList.add('media-broken');
            if (item.missing) repairIfCached(item, img);
          };
          itemEl.appendChild(img);
        }

        if (index === 3 && remaining > 0) {
          const overlay = document.createElement('div');
          overlay.className = 'collage-overlay';
          overlay.textContent = `+${remaining}`;
          itemEl.appendChild(overlay);
        }

        if (isUploading) {
          const spin = document.createElement('div');
          spin.className = 'upload-spinner-wrap';
          spin.innerHTML = '<div class="upload-spinner-ring"></div>';
          itemEl.appendChild(spin);
        }

        itemEl.onclick = (e) => {
          e.stopPropagation();
          if (!isUploading) {
            openLightbox(item);
          }
        };

        collage.appendChild(itemEl);
      });

      bubble.appendChild(collage);
    } else if (rawMediaList.length === 1) {
      const singleItem = rawMediaList[0];
      const mediaUrl = singleItem.url;
      const rawType = (singleItem.mediaType || '').toLowerCase();
      const mediaName = (singleItem.mediaName || '').toLowerCase();

      const isAudio =
        rawType === 'audio' ||
        rawType.startsWith('audio/') ||
        mediaName.includes('voice note') ||
        /\.(webm|ogg|wav|mp3|m4a|aac|opus)(\?|$)/i.test(mediaUrl);

      const isVideo =
        !isAudio &&
        (rawType === 'video' ||
         rawType.startsWith('video/') ||
         /\.(mp4|mov|mkv)(\?|$)/i.test(mediaUrl));

      const mediaDiv = document.createElement('div');
      if (isUploading) {
        mediaDiv.classList.add('uploading-skeleton');
      }

      if (isAudio) {
        bubble.classList.add('has-audio');
        mediaDiv.className = 'msg-media msg-audio';
        const header = document.createElement('div');
        header.className = 'voice-bubble-header';
        header.innerHTML = '<svg viewBox="0 0 24 24" class="voice-bubble-icon" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg><span>Voice Note</span>';

        const audio = document.createElement('audio');
        audio.src = normalizeMediaUrl(mediaUrl);
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
        video.src = normalizeMediaUrl(mediaUrl);
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
        img.src = normalizeMediaUrl(mediaUrl);
        img.alt = singleItem.mediaName || 'Photo';
        img.loading = 'lazy';
        img.onload = () => {
          if (singleItem.missing) repairIfCached(singleItem, img);
        };
        img.onerror = () => {
          img.classList.add('media-broken');
          if (singleItem.missing) repairIfCached(singleItem, img);
        };
        img.onclick = () => {
          if (!isUploading) openLightbox(singleItem);
        };
        mediaDiv.appendChild(img);
      }

      if (isUploading) {
        const spin = document.createElement('div');
        spin.className = 'upload-spinner-wrap';
        spin.innerHTML = '<div class="upload-spinner-ring"></div><span class="upload-spinner-label">Uploading…</span>';
        mediaDiv.appendChild(spin);
      }

      bubble.appendChild(mediaDiv);
    }

    if (msg.text) {
      const textP = document.createElement('p');
      textP.className = 'bubble-text';
      textP.textContent = msg.text;
      bubble.appendChild(textP);
    }

    // Integrated WhatsApp-style metadata (time & seen/unseen ticks inside bubble)
    const bubbleMeta = document.createElement('div');
    bubbleMeta.className = 'bubble-meta';

    if (msg.isEdited || msg.is_edited) {
      const editedSpan = document.createElement('span');
      editedSpan.className = 'msg-edited-badge';
      editedSpan.textContent = 'edited';
      bubbleMeta.appendChild(editedSpan);
    }

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

    // Message reactions container
    const reactionsDiv = document.createElement('div');
    reactionsDiv.className = 'msg-reactions';
    reactionsDiv.id = `msg-reactions-${msg.id}`;
    bubble.appendChild(reactionsDiv);
    renderMessageReactions(msg.id, msg.reactions);

    bodyDiv.appendChild(bubble);

    // Message options menu (emoji reaction trigger and down arrow on hover)
    const menuWrap = document.createElement('div');
    menuWrap.className = 'msg-menu-wrap';

    const reactBtn = document.createElement('button');
    reactBtn.type = 'button';
    reactBtn.className = 'msg-react-btn';
    reactBtn.title = 'Add reaction';
    reactBtn.setAttribute('aria-label', 'Add reaction');
    reactBtn.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>';

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'msg-down-btn';
    downBtn.title = 'Message options';
    downBtn.setAttribute('aria-label', 'Message options');
    downBtn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>';

    const reactionBar = document.createElement('div');
    reactionBar.className = 'msg-reaction-bar';
    reactionBar.hidden = true;

    const QUICK_REACTIONS = ['❤️', '😆', '😮', '😢', '😡', '👍'];
    const currentUserId = state.user ? state.user.id : null;
    const userCurrentEmoji = Array.isArray(msg.reactions)
      ? (msg.reactions.find((r) => r.users && r.users.some((u) => u.id === currentUserId)) || {}).emoji
      : null;

    for (const qEmoji of QUICK_REACTIONS) {
      const qBtn = document.createElement('button');
      qBtn.type = 'button';
      qBtn.className = `reaction-bar-btn ${userCurrentEmoji === qEmoji ? 'user-reacted' : ''}`;
      qBtn.textContent = qEmoji;
      qBtn.title = `React ${qEmoji}`;
      qBtn.onclick = (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        toggleReaction(msg.id, qEmoji);
      };
      reactionBar.appendChild(qBtn);
    }

    const plusBtn = document.createElement('button');
    plusBtn.type = 'button';
    plusBtn.className = 'reaction-bar-btn reaction-bar-plus';
    plusBtn.title = 'More reactions';
    plusBtn.setAttribute('aria-label', 'More reactions');
    plusBtn.innerHTML = '<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
    plusBtn.onclick = (e) => {
      e.stopPropagation();
      openReactionPicker(msg.id, plusBtn);
    };
    reactionBar.appendChild(plusBtn);

    function toggleReactionBar(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      const willOpen = reactionBar.hidden;
      closeAllDropdowns();
      if (willOpen) {
        reactionBar.hidden = false;
        reactBtn.classList.add('active');
        li.classList.add('show-menu');

        reactionBar.classList.remove('open-down');
        if (el.log) {
          const rRect = reactionBar.getBoundingClientRect();
          const lRect = el.log.getBoundingClientRect();
          if (rRect.top < lRect.top + 10) {
            reactionBar.classList.add('open-down');
          }
        }
      }
    }

    reactBtn.onclick = (e) => toggleReactionBar(e);

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

    // Option 2: Forward message
    const forwardItem = document.createElement('button');
    forwardItem.type = 'button';
    forwardItem.className = 'msg-dropdown-item';
    forwardItem.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 17 20 12 15 7"/><path d="M4 18v-2a4 4 0 0 1 4-4h12"/></svg><span>Forward</span>';
    forwardItem.onclick = (e) => {
      e.stopPropagation();
      closeAllDropdowns();
      state.selectedMessageIds.clear();
      state.selectedMessageIds.add(msg.id);
      openForwardDialog();
    };
    dropdown.appendChild(forwardItem);

    // Option: Edit Message (for own text messages)
    if (isOwn && msg.text && !isUploading) {
      const editItem = document.createElement('button');
      editItem.type = 'button';
      editItem.className = 'msg-dropdown-item';
      editItem.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg><span>Edit message</span>';
      editItem.onclick = (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        startEditMessage(msg);
      };
      dropdown.appendChild(editItem);
    }

    // Option 3: Copy Text
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

    // Option 4: Select messages (Multi-select & Forward)
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
    const primaryMedia = rawMediaList[0];
    if (primaryMedia && primaryMedia.url) {
      const downloadItem = document.createElement('button');
      downloadItem.type = 'button';
      downloadItem.className = 'msg-dropdown-item';
      downloadItem.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg><span>Download media</span>';
      downloadItem.onclick = (e) => {
        e.stopPropagation();
        closeAllDropdowns();
        downloadMediaFile(primaryMedia.url, primaryMedia.mediaName);
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

    if (!isUploading) {
      menuWrap.append(reactBtn, downBtn, reactionBar, dropdown);
      li.appendChild(menuWrap);
    }

    li.appendChild(bodyDiv);

    if (existingOptRow) {
      existingOptRow.replaceWith(li);
    } else {
      el.messages.appendChild(li);
    }
  }

  async function deleteMessage(msgId) {
    if (!confirm('Delete this message permanently?')) return;
    try {
      await api(`/api/messages/${msgId}`, { method: 'DELETE' });
      removeMessageRow(msgId);
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

  if (el.forwardDialog) {
    el.forwardDialog.addEventListener('close', () => {
      if (!state.isSelectionMode) {
        state.selectedMessageIds.clear();
      }
    });
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
    cancelEdit();
    let snippet = '';
    if (msg.text) {
      snippet = msg.text
        .trim()
        .replace(/\r\n/g, '\n')
        .replace(/\n\s*\n+/g, '\n');
    }
    if (!snippet) {
      const rawMediaList = Array.isArray(msg.mediaList) && msg.mediaList.length > 0
        ? msg.mediaList
        : (msg.mediaUrl || msg.media_url ? [{ url: msg.mediaUrl || msg.media_url, mediaType: msg.mediaType || msg.media_type }] : []);
      if (rawMediaList.length > 1) {
        snippet = `${rawMediaList.length} Photos/Videos`;
      } else {
        const type = (msg.mediaType || msg.media_type || (rawMediaList[0] && rawMediaList[0].mediaType) || '').toLowerCase();
        if (type === 'audio') snippet = 'Voice note';
        else if (type === 'image') snippet = 'Photo';
        else if (type === 'video') snippet = 'Video';
        else snippet = 'Attachment';
      }
    }
    const senderName = msg.senderName || (msg.senderId === state.user?.id ? 'You' : 'User');
    state.replyTarget = {
      id: msg.id,
      senderName,
      text: snippet.length > 160 ? snippet.slice(0, 160) + '…' : snippet,
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

  /* ------------------------------------------------------------- edit message feature */
  function startEditMessage(msg) {
    cancelReply();
    state.editingTarget = { id: msg.id, originalText: msg.text || '' };
    if (el.editBarSnippet) el.editBarSnippet.textContent = msg.text || '';
    if (el.editPreviewBar) el.editPreviewBar.hidden = false;
    el.input.value = msg.text || '';
    adjustInputHeight();
    el.input.focus();
  }

  function cancelEdit() {
    state.editingTarget = null;
    if (el.editPreviewBar) {
      el.editPreviewBar.hidden = true;
    }
    el.input.value = '';
    adjustInputHeight();
  }

  if (el.editCancel) {
    el.editCancel.onclick = cancelEdit;
  }

  let currentLightboxMedia = null;
  let lightboxPlaylist = [];
  let lightboxIndex = 0;

  function getChatMediaItems() {
    const list = [];
    const seen = new Set();
    if (!state.messagesCache) return list;
    for (const msg of state.messagesCache.values()) {
      if (msg.conversationId !== state.activeConversationId && msg.conversation_id !== state.activeConversationId) {
        continue;
      }
      if (Array.isArray(msg.mediaList) && msg.mediaList.length > 0) {
        for (const item of msg.mediaList) {
          if (!item || !item.url || seen.has(item.url)) continue;
          const isAudio = (item.mediaType && item.mediaType.startsWith('audio/')) || /\.(webm|ogg|wav|mp3|m4a|aac|opus)(\?|$)/i.test(item.url);
          if (!isAudio) {
            seen.add(item.url);
            list.push({
              url: item.url,
              mediaType: item.mediaType || 'image',
              mediaName: item.mediaName || 'Photo',
              msgId: msg.id,
            });
          }
        }
      } else if (msg.mediaUrl || msg.media_url) {
        const u = msg.mediaUrl || msg.media_url;
        if (!u || seen.has(u)) continue;
        const mt = (msg.mediaType || msg.media_type || '').toLowerCase();
        const mn = (msg.mediaName || msg.media_name || '').toLowerCase();
        const isAudio = mt.startsWith('audio/') || mn.includes('voice note') || /\.(webm|ogg|wav|mp3|m4a|aac|opus)(\?|$)/i.test(u);
        if (!isAudio) {
          seen.add(u);
          list.push({
            url: u,
            mediaType: mt || 'image',
            mediaName: msg.mediaName || msg.media_name || 'Photo',
            msgId: msg.id,
          });
        }
      }
    }
    return list;
  }

  function displayLightboxItem(item) {
    if (!item || !item.url) return;
    currentLightboxMedia = item;
    const rawType = (item.mediaType || '').toLowerCase();
    const isVideo = rawType === 'video' || rawType.startsWith('video/') || /\.(mp4|mov|mkv)(\?|$)/i.test(item.url);

    if (isVideo) {
      if (el.lightboxImg) {
        el.lightboxImg.hidden = true;
        el.lightboxImg.src = '';
      }
      if (el.lightboxVideo) {
        el.lightboxVideo.hidden = false;
        el.lightboxVideo.src = normalizeMediaUrl(item.url);
        el.lightboxVideo.play().catch(() => {});
      }
    } else {
      if (el.lightboxVideo) {
        el.lightboxVideo.hidden = true;
        el.lightboxVideo.pause();
        el.lightboxVideo.src = '';
      }
      if (el.lightboxImg) {
        el.lightboxImg.hidden = false;
        el.lightboxImg.src = normalizeMediaUrl(item.url);
      }
    }

    if (el.lightboxGallery) {
      const thumbs = el.lightboxGallery.querySelectorAll('.lightbox-gallery-thumb');
      thumbs.forEach((thumb) => {
        if (thumb.dataset.url === item.url) {
          thumb.classList.add('active');
          thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
          thumb.classList.remove('active');
        }
      });
    }

    const hasMultiple = lightboxPlaylist.length > 1;
    if (el.lightboxPrev) el.lightboxPrev.style.display = hasMultiple ? 'flex' : 'none';
    if (el.lightboxNext) el.lightboxNext.style.display = hasMultiple ? 'flex' : 'none';
  }

  function nextLightboxItem() {
    if (!lightboxPlaylist.length) return;
    lightboxIndex = (lightboxIndex + 1) % lightboxPlaylist.length;
    displayLightboxItem(lightboxPlaylist[lightboxIndex]);
  }

  function prevLightboxItem() {
    if (!lightboxPlaylist.length) return;
    lightboxIndex = (lightboxIndex - 1 + lightboxPlaylist.length) % lightboxPlaylist.length;
    displayLightboxItem(lightboxPlaylist[lightboxIndex]);
  }

  function renderLightboxGallery(activeUrl) {
    if (!el.lightboxGallery) return;
    el.lightboxGallery.replaceChildren();
    const mediaItems = (lightboxPlaylist && lightboxPlaylist.length > 0) ? lightboxPlaylist : getChatMediaItems();

    if (!mediaItems || mediaItems.length === 0) {
      if (el.lightboxGalleryWrap) el.lightboxGalleryWrap.hidden = true;
      return;
    }

    if (el.lightboxGalleryWrap) el.lightboxGalleryWrap.hidden = false;

    mediaItems.forEach((item, idx) => {
      const thumb = document.createElement('div');
      thumb.className = `lightbox-gallery-thumb ${item.url === activeUrl ? 'active' : ''}`;
      thumb.dataset.url = item.url;

      const rawType = (item.mediaType || '').toLowerCase();
      const isVideo = rawType === 'video' || rawType.startsWith('video/') || /\.(mp4|mov|mkv)(\?|$)/i.test(item.url);

      if (isVideo) {
        const vid = document.createElement('video');
        vid.src = normalizeMediaUrl(item.url);
        vid.preload = 'metadata';
        vid.muted = true;
        const iconWrap = document.createElement('div');
        iconWrap.className = 'thumb-video-icon';
        iconWrap.innerHTML = '<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
        thumb.append(vid, iconWrap);
      } else {
        const img = document.createElement('img');
        img.src = normalizeMediaUrl(item.url);
        img.alt = item.mediaName || 'Thumbnail';
        img.loading = 'lazy';
        thumb.appendChild(img);
      }

      thumb.onclick = (e) => {
        e.stopPropagation();
        lightboxIndex = idx;
        displayLightboxItem(item);
      };

      el.lightboxGallery.appendChild(thumb);
    });
  }

  function openLightbox(media, customPlaylist = null) {
    const item = typeof media === 'string'
      ? { url: media, mediaType: 'image', mediaName: 'Media' }
      : media;
    if (!item || !item.url) return;

    const chatMedia = getChatMediaItems();
    if (chatMedia.length > 0) {
      const exists = chatMedia.some((m) => m.url === item.url);
      if (!exists) chatMedia.push(item);
      lightboxPlaylist = chatMedia;
    } else if (Array.isArray(customPlaylist) && customPlaylist.length > 0) {
      lightboxPlaylist = customPlaylist.map((m) => typeof m === 'string' ? { url: m, mediaType: 'image', mediaName: 'Photo' } : m);
    } else {
      lightboxPlaylist = [item];
    }

    const foundIdx = lightboxPlaylist.findIndex((p) => p.url === item.url);
    lightboxIndex = foundIdx >= 0 ? foundIdx : 0;

    displayLightboxItem(lightboxPlaylist[lightboxIndex]);
    renderLightboxGallery(lightboxPlaylist[lightboxIndex].url);
    if (el.lightboxDialog && !el.lightboxDialog.open) {
      el.lightboxDialog.showModal();
    }
  }

  function closeLightbox() {
    if (el.lightboxVideo) {
      el.lightboxVideo.pause();
      el.lightboxVideo.src = '';
    }
    if (el.lightboxImg) {
      el.lightboxImg.src = '';
    }
    currentLightboxMedia = null;
    if (el.lightboxDialog && el.lightboxDialog.open) {
      el.lightboxDialog.close();
    }
  }

  if (el.lightboxPrev) {
    el.lightboxPrev.onclick = (e) => {
      e.stopPropagation();
      prevLightboxItem();
    };
  }

  if (el.lightboxNext) {
    el.lightboxNext.onclick = (e) => {
      e.stopPropagation();
      nextLightboxItem();
    };
  }

  // Keyboard navigation for Lightbox
  document.addEventListener('keydown', (e) => {
    if (el.lightboxDialog && el.lightboxDialog.open) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevLightboxItem();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextLightboxItem();
      } else if (e.key === 'Escape') {
        closeLightbox();
      }
    }
  });

  // Touch swipe support for mobile in Lightbox
  if (el.lightboxMediaContainer) {
    let touchStartX = 0;
    let touchStartY = 0;
    el.lightboxMediaContainer.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    el.lightboxMediaContainer.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches.length === 1) {
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) {
            prevLightboxItem();
          } else {
            nextLightboxItem();
          }
        }
      }
    }, { passive: true });
  }

  if (el.lightboxDownloadBtn) {
    el.lightboxDownloadBtn.onclick = (e) => {
      e.stopPropagation();
      if (currentLightboxMedia && currentLightboxMedia.url) {
        downloadMediaFile(currentLightboxMedia.url, currentLightboxMedia.mediaName);
      }
    };
  }

  if (el.lightboxClose) {
    el.lightboxClose.onclick = () => closeLightbox();
  }

  if (el.lightboxDialog) {
    el.lightboxDialog.onclick = (e) => {
      if (e.target === el.lightboxDialog || e.target.classList.contains('lightbox-content') || e.target.classList.contains('lightbox-media-container')) {
        closeLightbox();
      }
    };
    el.lightboxDialog.addEventListener('close', () => {
      if (el.lightboxVideo) {
        el.lightboxVideo.pause();
        el.lightboxVideo.src = '';
      }
      if (el.lightboxImg) {
        el.lightboxImg.src = '';
      }
      currentLightboxMedia = null;
    });
  }

  function markOptimisticError(tempId) {
    const row = $(`msg-${tempId}`);
    if (row) {
      const bubble = row.querySelector('.bubble');
      if (bubble) {
        const errTag = document.createElement('div');
        errTag.style.color = '#ef4444';
        errTag.style.fontSize = '0.75rem';
        errTag.style.marginTop = '4px';
        errTag.textContent = 'Upload failed. Please try again.';
        bubble.appendChild(errTag);
      }
      const spinner = row.querySelector('.upload-spinner-wrap');
      if (spinner) spinner.remove();
    }
  }

  /* ------------------------------------------------------------- sending */
  el.composer.onsubmit = async (e) => {
    e.preventDefault();
    if (!state.activeConversationId) return;

    // Handle Editing mode
    if (state.editingTarget) {
      const newText = el.input.value.trim();
      if (!newText) {
        toast('Message text cannot be empty');
        return;
      }
      const editMsgId = state.editingTarget.id;
      cancelEdit();

      try {
        await api(`/api/messages/${editMsgId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: newText }),
        });
        toast('Message edited');
      } catch (err) {
        toast(err.message || 'Failed to edit message');
      }
      return;
    }

    const text = el.input.value.trim();
    const filesToSend = (state.selectedFiles && state.selectedFiles.length > 0)
      ? [...state.selectedFiles]
      : (state.selectedFile ? [state.selectedFile] : []);

    if (!text && !filesToSend.length) return;

    const activeConvId = state.activeConversationId;
    const replyTarget = state.replyTarget ? { ...state.replyTarget } : null;

    // Reset input and attachments immediately so the user can keep typing without waiting!
    el.input.value = '';
    adjustInputHeight();
    clearMediaSelection();
    cancelReply();
    playSendSound();
    el.input.focus();

    // 1. Text-only message
    if (!filesToSend.length) {
      const payload = {
        conversationId: activeConvId,
        text,
        mediaUrl: null,
        mediaType: null,
        mediaName: null,
      };

      if (replyTarget) {
        payload.replyToId = replyTarget.id;
        payload.replyToSender = replyTarget.senderName;
        payload.replyToText = replyTarget.text;
      }

      socket.emit('message', payload, (ack) => {
        if (ack && !ack.ok) {
          toast(ack.error || 'Failed to send message');
        }
      });
      return;
    }

    // 2. Media sending: Optimistic rendering with blurred skeleton and loading spinner
    const tempId = 'opt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const localPreviews = filesToSend.map((file) => {
      const url = URL.createObjectURL(file);
      const isVid = file.type && file.type.startsWith('video/');
      const isAud = file.type && file.type.startsWith('audio/');
      return {
        url,
        mediaType: isAud ? 'audio' : (isVid ? 'video' : 'image'),
        mediaName: file.name,
        size: file.size,
        file,
      };
    });

    const optMsg = {
      id: tempId,
      tempId,
      conversationId: activeConvId,
      senderId: state.user.id,
      senderName: state.user.name,
      text,
      mediaUrl: localPreviews[0].url,
      mediaType: localPreviews[0].mediaType,
      mediaName: localPreviews[0].mediaName,
      mediaList: localPreviews.map((m) => ({ url: m.url, mediaType: m.mediaType, mediaName: m.mediaName })),
      replyToId: replyTarget ? replyTarget.id : null,
      replyToSender: replyTarget ? replyTarget.senderName : null,
      replyToText: replyTarget ? replyTarget.text : null,
      status: 'uploading',
      ts: Date.now(),
      isOptimistic: true,
      blobUrls: localPreviews.map((m) => m.url),
    };

    appendMessage(optMsg);
    scrollToBottom();

    // Send photo/media one by one in the background
    (async () => {
      try {
        const uploadedList = [];
        for (let i = 0; i < localPreviews.length; i++) {
          const item = localPreviews[i];
          const fd = new FormData();
          fd.append('media', item.file);

          const uploadRes = await fetch(`${BASE}/api/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${state.token}` },
            body: fd,
          });

          const data = await uploadRes.json();
          if (!uploadRes.ok) throw new Error(data.error || 'Upload failed');
          uploadedList.push({
            url: data.url,
            mediaType: data.mediaType,
            mediaName: data.mediaName,
            size: data.size,
          });
        }

        const payload = {
          tempId,
          conversationId: activeConvId,
          text,
          mediaUrl: uploadedList[0].url,
          mediaType: uploadedList[0].mediaType,
          mediaName: uploadedList[0].mediaName,
          mediaList: uploadedList,
          replyToId: optMsg.replyToId,
          replyToSender: optMsg.replyToSender,
          replyToText: optMsg.replyToText,
        };

        socket.emit('message', payload, (ack) => {
          if (ack && !ack.ok) {
            toast(ack.error || 'Failed to send message');
            markOptimisticError(tempId);
          }
        });
      } catch (uploadErr) {
        console.error('Optimistic upload failed:', uploadErr);
        toast(`Upload failed: ${uploadErr.message}`);
        markOptimisticError(tempId);
      }
    })();
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

  function adjustInputHeight() {
    if (!el.input) return;
    el.input.style.height = 'auto';
    const isMobile = window.innerWidth <= 768;
    const minH = isMobile ? 36 : 42;
    const maxH = isMobile ? 100 : 120;
    const scrollH = el.input.scrollHeight;
    if (scrollH > maxH) {
      el.input.style.height = maxH + 'px';
      el.input.style.overflowY = 'auto';
    } else {
      const newHeight = Math.max(scrollH, minH);
      el.input.style.height = newHeight + 'px';
      el.input.style.overflowY = 'hidden';
    }
  }

  // Typing indicator broadcast & typing sound effect
  let typingTimer = null;
  el.input.oninput = () => {
    adjustInputHeight();
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

  /* ------------------------------------------------------------- emoji library & picker */
  const EMOJI_CATEGORIES = [
    {
      id: 'smileys',
      name: 'Smileys & Emotion',
      icon: '😀',
      emojis: [
        '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','🫠','😉','😊','😇','🥰','😍',
        '🤩','😘','😗','😚','😙','🥲','😋','😛','😜','🤪','😝','🤑','🤗','🫣','🤭','🫢',
        '🤫','🤔','🫡','🤐','🤨','😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','🫨','😌',
        '😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠',
        '🥳','🥸','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','🥹','😦',
        '😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡',
        '😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖'
      ],
    },
    {
      id: 'gestures',
      name: 'People & Gestures',
      icon: '👍',
      emojis: [
        '👍','👎','👏','🙌','👐','🤲','🤝','🙏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉',
        '👆','🖕','👇','☝️','🫵','👋','🤚','🖐️','✋','🖖','🫱','🫲','🫳','🫴','👌','🤌',
        '🤏','✊','👊','🤛','🤜','🫷','🫸','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂',
        '🦻','👃','🧠','🫀','🫁','👀','👁️','👅','👄','👶','👧','🧒','👦','👩','🧑','👨',
        '👱‍♀️','👱‍♂️','🧓','👵','👴'
      ],
    },
    {
      id: 'hearts',
      name: 'Hearts & Reactions',
      icon: '❤️',
      emojis: [
        '❤️','🧡','💛','💚','💙','💜','🤎','🖤','🤍','💔','❣️','💕','💞','💓','💗','💖',
        '💘','💝','💟','🔥','✨','⭐','🌟','💫','💥','💯','💢','💤','💨','🎉','🎊','🎈',
        '🎁','🏆','🥇','🥈','🥉','🏅','🎖️','🎯','🎲','🎵','🎶','🔔','💬','💭'
      ],
    },
    {
      id: 'animals',
      name: 'Animals & Nature',
      icon: '🐶',
      emojis: [
        '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵',
        '🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗',
        '🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜','🐢','🐍','🦎','🐙','🦑','🦐','🦞','🦀',
        '🐡','🐠','🐟','🐬','🐳','🐋','🦈','🐊','🐅','🐆','🦓','🦍','🐘','🦛','🦏'
      ],
    },
    {
      id: 'food',
      name: 'Food & Drinks',
      icon: '🍕',
      emojis: [
        '🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥',
        '🥝','🍅','🍆','🥑','🥦','🌽','🌶️','🫑','🥒','🥬','🥔','🍠','🥐','🍞','🥖','🧀',
        '🍳','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🥪','🥙','🌮','🌯','🥗',
        '🍿','🍣','🍱','🍦','🍧','🍨','🍩','🍪','🎂','🍰','🍫','🍬','🍭','☕','🍵','🧃',
        '🥤','🍺','🍻','🥂','🍷','🥃','🍸','🍹'
      ],
    },
    {
      id: 'activities',
      name: 'Travel & Objects',
      icon: '🚀',
      emojis: [
        '⚽','🏀','🏈','⚾','🎾','🏐','🎱','🏓','🏸','🥅','🥊','🎯','🎮','🕹️','🚗','🚕',
        '🚙','🚌','🏎️','🚓','🚑','🚒','🚲','🛵','🏍️','✈️','🚀','🛸','🚁','⛵','🚢','⚓',
        '⏰','📱','💻','⌨️','🖥️','📷','🎥','📺','📻','💡','🔦','💰','💵','💳','💎'
      ],
    },
  ];

  function initEmojiPicker() {
    if (!el.emojiPicker) return;
    el.emojiPicker.replaceChildren();

    const tabsBar = document.createElement('div');
    tabsBar.className = 'emoji-cat-tabs';

    const sectionsWrap = document.createElement('div');
    sectionsWrap.className = 'emoji-sections-wrap';

    EMOJI_CATEGORIES.forEach((cat, idx) => {
      const tabBtn = document.createElement('button');
      tabBtn.type = 'button';
      tabBtn.className = `emoji-cat-tab-btn ${idx === 0 ? 'active' : ''}`;
      tabBtn.textContent = cat.icon;
      tabBtn.title = cat.name;
      tabBtn.setAttribute('aria-label', cat.name);
      tabBtn.onclick = (e) => {
        e.stopPropagation();
        tabsBar.querySelectorAll('.emoji-cat-tab-btn').forEach((b) => b.classList.remove('active'));
        tabBtn.classList.add('active');
        const targetSection = el.emojiPicker.querySelector(`#emoji-sec-${cat.id}`);
        if (targetSection) {
          targetSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      };
      tabsBar.appendChild(tabBtn);

      const secDiv = document.createElement('div');
      secDiv.id = `emoji-sec-${cat.id}`;
      secDiv.className = 'emoji-section';

      const title = document.createElement('div');
      title.className = 'emoji-cat-title';
      title.textContent = cat.name;
      secDiv.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'emoji-cat-grid';

      for (const emoji of cat.emojis) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'emoji-btn-item';
        btn.textContent = emoji;
        btn.title = emoji;
        btn.onclick = (e) => {
          e.stopPropagation();
          el.input.value += emoji;
          adjustInputHeight();
          el.input.focus();
        };
        grid.appendChild(btn);
      }

      secDiv.appendChild(grid);
      sectionsWrap.appendChild(secDiv);
    });

    el.emojiPicker.append(tabsBar, sectionsWrap);
  }

  el.emojiBtn.onclick = (e) => {
    e.stopPropagation();
    el.emojiPicker.hidden = !el.emojiPicker.hidden;
  };

  document.addEventListener('click', (e) => {
    if (el.emojiPicker && !el.emojiPicker.contains(e.target) && e.target !== el.emojiBtn) {
      el.emojiPicker.hidden = true;
    }
  });

  /* ------------------------------------------------------------- message reaction handlers */
  let activeReactionMsgId = null;

  function openReactionPicker(msgId, anchorBtn) {
    const popover = document.getElementById('reaction-full-picker-popover');
    if (!popover) return;
    activeReactionMsgId = msgId;

    popover.replaceChildren();

    const tabsBar = document.createElement('div');
    tabsBar.className = 'emoji-cat-tabs';

    const sectionsWrap = document.createElement('div');
    sectionsWrap.className = 'emoji-sections-wrap';

    EMOJI_CATEGORIES.forEach((cat, idx) => {
      const tabBtn = document.createElement('button');
      tabBtn.type = 'button';
      tabBtn.className = `emoji-cat-tab-btn ${idx === 0 ? 'active' : ''}`;
      tabBtn.textContent = cat.icon;
      tabBtn.title = cat.name;
      tabBtn.setAttribute('aria-label', cat.name);
      tabBtn.onclick = (e) => {
        e.stopPropagation();
        tabsBar.querySelectorAll('.emoji-cat-tab-btn').forEach((b) => b.classList.remove('active'));
        tabBtn.classList.add('active');
        const targetSection = popover.querySelector(`#react-sec-${cat.id}`);
        if (targetSection) {
          targetSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      };
      tabsBar.appendChild(tabBtn);

      const secDiv = document.createElement('div');
      secDiv.id = `react-sec-${cat.id}`;
      secDiv.className = 'emoji-section';

      const title = document.createElement('div');
      title.className = 'emoji-cat-title';
      title.textContent = cat.name;
      secDiv.appendChild(title);

      const grid = document.createElement('div');
      grid.className = 'emoji-cat-grid';

      for (const emoji of cat.emojis) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'emoji-btn-item';
        btn.textContent = emoji;
        btn.title = emoji;
        btn.onclick = (e) => {
          e.stopPropagation();
          toggleReaction(msgId, emoji);
          closeAllDropdowns();
        };
        grid.appendChild(btn);
      }

      secDiv.appendChild(grid);
      sectionsWrap.appendChild(secDiv);
    });

    popover.append(tabsBar, sectionsWrap);
    popover.hidden = false;

    if (anchorBtn) {
      const rect = anchorBtn.getBoundingClientRect();
      let top = rect.bottom + 8;
      let left = rect.left - 130;

      if (left + 330 > window.innerWidth) {
        left = window.innerWidth - 340;
      }
      if (left < 10) left = 10;

      if (top + 310 > window.innerHeight) {
        top = Math.max(10, rect.top - 315);
      }

      popover.style.top = `${top}px`;
      popover.style.left = `${left}px`;
      popover.style.position = 'fixed';
    }
  }

  function closeReactionPicker() {
    const popover = document.getElementById('reaction-full-picker-popover');
    if (popover) {
      popover.hidden = true;
      activeReactionMsgId = null;
    }
  }

  async function toggleReaction(messageId, emoji) {
    if (!messageId || !emoji) return;

    // Optimistic cache update
    const cached = state.messagesCache.get(messageId);
    if (cached) {
      if (!Array.isArray(cached.reactions)) cached.reactions = [];
      const user = state.user || {};
      const existingIdx = cached.reactions.findIndex((r) => r.users && r.users.some((u) => u.id === user.id));

      if (existingIdx !== -1) {
        const existing = cached.reactions[existingIdx];
        if (existing.emoji === emoji) {
          // Toggle off
          existing.count--;
          existing.users = existing.users.filter((u) => u.id !== user.id);
          if (existing.count <= 0) {
            cached.reactions.splice(existingIdx, 1);
          }
        } else {
          // Switch to new emoji
          existing.count--;
          existing.users = existing.users.filter((u) => u.id !== user.id);
          if (existing.count <= 0) {
            cached.reactions.splice(existingIdx, 1);
          }
          const target = cached.reactions.find((r) => r.emoji === emoji);
          if (target) {
            target.count++;
            target.users.push({ id: user.id, name: user.name });
          } else {
            cached.reactions.push({ emoji, count: 1, users: [{ id: user.id, name: user.name }] });
          }
        }
      } else {
        // Add new
        const target = cached.reactions.find((r) => r.emoji === emoji);
        if (target) {
          target.count++;
          target.users.push({ id: user.id, name: user.name });
        } else {
          cached.reactions.push({ emoji, count: 1, users: [{ id: user.id, name: user.name }] });
        }
      }
      renderMessageReactions(messageId, cached.reactions);
    }

    if (socket && socket.connected) {
      socket.emit('react_message', { messageId, emoji }, (res) => {
        if (res && res.ok && res.reactions) {
          if (cached) cached.reactions = res.reactions;
          renderMessageReactions(messageId, res.reactions);
        }
      });
    } else {
      try {
        const res = await api(`/api/messages/${messageId}/react`, {
          method: 'POST',
          body: JSON.stringify({ emoji }),
        });
        if (res && res.ok && res.reactions) {
          if (cached) cached.reactions = res.reactions;
          renderMessageReactions(messageId, res.reactions);
        }
      } catch (err) {
        console.error('Toggle reaction error:', err);
      }
    }
  }

  function renderMessageReactions(messageId, reactions) {
    const bubble = document.getElementById(`msg-bubble-${messageId}`);
    if (!bubble) return;

    let reactionsDiv = document.getElementById(`msg-reactions-${messageId}`);
    if (!reactionsDiv) {
      reactionsDiv = document.createElement('div');
      reactionsDiv.className = 'msg-reactions';
      reactionsDiv.id = `msg-reactions-${messageId}`;
      bubble.appendChild(reactionsDiv);
    }

    reactionsDiv.replaceChildren();

    if (!Array.isArray(reactions) || reactions.length === 0) {
      reactionsDiv.hidden = true;
      return;
    }

    reactionsDiv.hidden = false;
    const currentUserId = state.user ? state.user.id : null;

    for (const r of reactions) {
      if (!r || r.count <= 0) continue;
      const isUserReacted = Array.isArray(r.users) && r.users.some((u) => u.id === currentUserId);

      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `reaction-chip ${isUserReacted ? 'active' : ''}`;
      chip.setAttribute('data-emoji', r.emoji);

      let namesTooltip = '';
      if (Array.isArray(r.users) && r.users.length) {
        const names = r.users.map((u) => (u.id === currentUserId ? 'You' : u.name || 'User'));
        namesTooltip = names.join(', ');
      }
      chip.title = namesTooltip || `${r.emoji} reaction`;

      chip.innerHTML = `
        <span class="reaction-emoji">${r.emoji}</span>
        <span class="reaction-count">${r.count}</span>
      `;

      chip.onclick = (e) => {
        e.stopPropagation();
        toggleReaction(messageId, r.emoji);
      };

      reactionsDiv.appendChild(chip);
    }
  }

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
  function getEligibleGroupContacts() {
    const map = new Map();
    if (state.friends && state.friends.length) {
      for (const f of state.friends) {
        if (!f || !f.phone) continue;
        map.set(f.phone, {
          id: f.id,
          phone: f.phone,
          name: f.name || f.phone,
          avatarColor: f.avatarColor || 0,
          avatarUrl: f.avatarUrl || null,
        });
      }
    }
    if (state.conversations && state.conversations.length) {
      for (const conv of state.conversations) {
        if (conv.type === 'dm' && conv.otherUserPhone) {
          if (!map.has(conv.otherUserPhone)) {
            map.set(conv.otherUserPhone, {
              id: conv.otherUserId,
              phone: conv.otherUserPhone,
              name: conv.title || conv.otherUserName || conv.otherUserPhone,
              avatarColor: conv.avatarColor || 0,
              avatarUrl: conv.avatarUrl || null,
            });
          } else {
            const existing = map.get(conv.otherUserPhone);
            if ((!existing.name || existing.name === existing.phone) && conv.title && conv.title !== conv.otherUserPhone) {
              existing.name = conv.title;
            }
          }
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  function renderGroupFriendsPicker(filterText = '') {
    if (!el.groupFriendsList) return;
    el.groupFriendsList.replaceChildren();
    const q = (filterText || '').toLowerCase().trim();

    const contacts = getEligibleGroupContacts();
    if (!contacts.length) {
      const empty = document.createElement('div');
      empty.className = 'picker-empty';
      empty.textContent = 'No friends or contacts available yet. Start a chat or add friends first.';
      el.groupFriendsList.appendChild(empty);
      return;
    }

    const filtered = contacts.filter((c) => {
      return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q);
    });

    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'picker-empty';
      empty.textContent = `No contacts match "${escapeHtml(filterText)}"`;
      el.groupFriendsList.appendChild(empty);
      return;
    }

    filtered.forEach((contact) => {
      const label = document.createElement('label');
      label.className = 'group-friend-row';

      const check = document.createElement('input');
      check.type = 'checkbox';
      check.className = 'group-friend-check';
      check.value = contact.phone;
      check.checked = state.selectedGroupFriends.has(contact.phone);

      check.onchange = () => {
        if (check.checked) {
          state.selectedGroupFriends.add(contact.phone);
        } else {
          state.selectedGroupFriends.delete(contact.phone);
        }
        if (el.groupFriendsCount) {
          el.groupFriendsCount.textContent = `${state.selectedGroupFriends.size} selected`;
        }
      };

      const avatar = document.createElement('span');
      avatar.className = 'avatar small';
      renderAvatar(avatar, contact.name, contact.avatarColor, contact.avatarUrl);

      const info = document.createElement('div');
      info.className = 'group-friend-info';
      const name = document.createElement('span');
      name.className = 'group-friend-name';
      name.textContent = contact.name;
      const phone = document.createElement('span');
      phone.className = 'group-friend-phone';
      phone.textContent = contact.phone;
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
      const phone = getNormalizedPhone(el.dmCountry, el.dmPhone);
      if (!phone) throw new Error('Please enter a valid phone number');
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
        const targetName = (err.data.user && err.data.user.name) || 'user';
        try {
          const reqRes = await api('/api/friends/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone }),
          });
          el.dmPhone.value = '';
          el.newChatDialog.close();
          if (reqRes && reqRes.status === 'accepted') {
            toast(`You and ${targetName} are now friends! Opening chat…`);
            await loadConversations();
            const convRes = await api('/api/conversations/direct', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone }),
            });
            if (convRes && convRes.conversation) {
              switchConversation(convRes.conversation.id);
            }
          } else {
            toast(`Friend request sent to ${targetName}! Once accepted, you can chat.`);
          }
          loadFriends();
        } catch (reqErr) {
          el.dmError.textContent = reqErr.message || 'Failed to send friend request.';
        }
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
      const phone = getNormalizedPhone(el.friendCountry, el.friendPhone);
      if (!phone) throw new Error('Please enter a valid phone number');
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

  /* ------------------------------------------------------------- Telegram-style Chat Info Sidepanel & Shared Media Browser */
  let cachedConversationMedia = null;

  async function openChatInfoPanel() {
    if (!state.activeConversationId) return;
    const conv = state.conversations.find((c) => c.id === state.activeConversationId);
    if (!conv) return;

    // Reset views: show main profile info view, hide media view
    if (el.infoPanelMain) el.infoPanelMain.hidden = false;
    if (el.infoPanelMediaView) el.infoPanelMediaView.hidden = true;

    // Populate profile card
    if (el.infoName) el.infoName.textContent = conv.name;

    if (conv.type === 'group') {
      if (el.infoAvatar) {
        if (conv.avatarUrl) {
          renderAvatar(el.infoAvatar, conv.name, conv.avatarColor || 0, conv.avatarUrl, false);
          el.infoAvatar.classList.add('large');
        } else {
          el.infoAvatar.className = `avatar c-${conv.avatarColor || 0} large`;
          el.infoAvatar.textContent = '👥';
        }
      }
      if (el.infoStatus) el.infoStatus.textContent = `${conv.memberCount || 1} members`;
      if (el.infoPhoneText) el.infoPhoneText.textContent = `${conv.memberCount || 1} members in group`;
      if (el.infoPhoneLabel) el.infoPhoneLabel.textContent = 'Group Info';
      if (el.infoActBlock) el.infoActBlock.hidden = true;
      if (el.infoGroupDescWrap) el.infoGroupDescWrap.hidden = true;
    } else {
      if (el.infoAvatar) {
        renderAvatar(el.infoAvatar, conv.name, conv.avatarColor, conv.avatarUrl, conv.isOnline);
        el.infoAvatar.classList.add('large');
      }
      if (el.infoStatus) {
        el.infoStatus.textContent = conv.isOnline ? 'online' : 'offline';
        el.infoStatus.className = `info-status ${conv.isOnline ? 'online' : ''}`;
      }
      if (el.infoPhoneText) el.infoPhoneText.textContent = conv.phone || 'Mobile';
      if (el.infoPhoneLabel) el.infoPhoneLabel.textContent = 'Mobile';
      if (el.infoActBlock) el.infoActBlock.hidden = false;
      if (el.infoGroupDescWrap) el.infoGroupDescWrap.hidden = true;
    }

    // Reset counts to loading
    if (el.infoCountPhotos) el.infoCountPhotos.textContent = '…';
    if (el.infoCountVideos) el.infoCountVideos.textContent = '…';
    if (el.infoCountFiles) el.infoCountFiles.textContent = '…';
    if (el.infoCountVoice) el.infoCountVoice.textContent = '…';

    // Slide open sidepanel
    if (el.chatInfoPanel) el.chatInfoPanel.classList.add('open');
    if (el.infoPanelScrim) {
      el.infoPanelScrim.hidden = false;
      setTimeout(() => el.infoPanelScrim.classList.add('visible'), 10);
    }

    // Load media counts from API
    try {
      const data = await api(`/api/conversations/${conv.id}/media`);
      cachedConversationMedia = data;
      const counts = data.counts || { photos: 0, videos: 0, files: 0, audio: 0 };
      if (el.infoCountPhotos) el.infoCountPhotos.textContent = `${counts.photos} photo${counts.photos === 1 ? '' : 's'}`;
      if (el.infoCountVideos) el.infoCountVideos.textContent = `${counts.videos} video${counts.videos === 1 ? '' : 's'}`;
      if (el.infoCountFiles) el.infoCountFiles.textContent = `${counts.files} file${counts.files === 1 ? '' : 's'}`;
      if (el.infoCountVoice) el.infoCountVoice.textContent = `${counts.audio} voice note${counts.audio === 1 ? '' : 's'}`;
    } catch (e) {
      console.error('Failed to load conversation media:', e);
      if (el.infoCountPhotos) el.infoCountPhotos.textContent = '0 photos';
      if (el.infoCountVideos) el.infoCountVideos.textContent = '0 videos';
      if (el.infoCountFiles) el.infoCountFiles.textContent = '0 files';
      if (el.infoCountVoice) el.infoCountVoice.textContent = '0 voice notes';
    }
  }

  function closeChatInfoPanel() {
    if (el.chatInfoPanel) el.chatInfoPanel.classList.remove('open');
    if (el.infoPanelScrim) {
      el.infoPanelScrim.classList.remove('visible');
      setTimeout(() => { el.infoPanelScrim.hidden = true; }, 260);
    }
  }

  function openSharedMediaBrowser(category) {
    if (!el.infoPanelMain || !el.infoPanelMediaView) return;
    el.infoPanelMain.hidden = true;
    el.infoPanelMediaView.hidden = false;

    const titles = {
      photos: 'Photos',
      videos: 'Videos',
      files: 'Files',
      audio: 'Voice notes',
    };
    if (el.infoMediaTitle) el.infoMediaTitle.textContent = titles[category] || 'Media';
    renderSharedMediaCategory(category);
  }

  function renderSharedMediaCategory(category) {
    if (!el.infoMediaContent) return;
    el.infoMediaContent.replaceChildren();

    const mediaData = cachedConversationMedia || { photos: [], videos: [], files: [], audio: [] };
    const items = mediaData[category] || [];

    if (!items.length) {
      const notice = document.createElement('div');
      notice.className = 'media-empty-notice';
      notice.textContent = `No ${category === 'audio' ? 'voice notes' : category} in this chat yet.`;
      el.infoMediaContent.appendChild(notice);
      return;
    }

    const titleSec = document.createElement('div');
    titleSec.className = 'media-browser-section-title';
    titleSec.textContent = `Shared ${category === 'audio' ? 'Voice Notes' : category.toUpperCase()} (${items.length})`;
    el.infoMediaContent.appendChild(titleSec);

    if (category === 'photos' || category === 'videos') {
      const grid = document.createElement('div');
      grid.className = 'media-browser-grid';
      items.forEach((item) => {
        const thumb = document.createElement('div');
        thumb.className = 'media-browser-thumb';
        if (category === 'videos') {
          const vid = document.createElement('video');
          vid.src = normalizeMediaUrl(item.url);
          vid.preload = 'metadata';
          vid.muted = true;
          const badge = document.createElement('div');
          badge.className = 'thumb-vid-badge';
          badge.innerHTML = '<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
          thumb.append(vid, badge);
        } else {
          const img = document.createElement('img');
          img.src = normalizeMediaUrl(item.url);
          img.alt = item.mediaName || 'Photo';
          img.loading = 'lazy';
          thumb.appendChild(img);
        }

        thumb.onclick = () => {
          openLightbox(item, items);
        };
        grid.appendChild(thumb);
      });
      el.infoMediaContent.appendChild(grid);
    } else if (category === 'files') {
      items.forEach((item) => {
        const fileCard = document.createElement('div');
        fileCard.className = 'media-file-item';
        fileCard.innerHTML = `
          <div class="media-file-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
          </div>
          <div class="media-file-info">
            <div class="media-file-name">${escapeHtml(item.mediaName || 'File')}</div>
            <div class="media-file-meta">${formatShortTime(item.ts)}</div>
          </div>
        `;
        fileCard.onclick = () => downloadMediaFile(item.url, item.mediaName);
        el.infoMediaContent.appendChild(fileCard);
      });
    } else if (category === 'audio') {
      items.forEach((item) => {
        const audioCard = document.createElement('div');
        audioCard.className = 'media-file-item';
        audioCard.style.flexDirection = 'column';
        audioCard.style.alignItems = 'stretch';
        audioCard.innerHTML = `
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
            <div class="media-file-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            </div>
            <div>
              <div class="media-file-name">${escapeHtml(item.senderName || 'Voice Note')}</div>
              <div class="media-file-meta">${formatShortTime(item.ts)}</div>
            </div>
          </div>
          <audio src="${normalizeMediaUrl(item.url)}" controls preload="none" style="width:100%;height:36px;"></audio>
        `;
        el.infoMediaContent.appendChild(audioCard);
      });
    }
  }

  function toggleChatInfoPanel() {
    if (!state.activeConversationId) return;
    const conv = state.conversations.find((c) => c.id === state.activeConversationId);
    if (!conv || conv.type === 'group') return;
    if (el.chatInfoPanel && el.chatInfoPanel.classList.contains('open')) {
      closeChatInfoPanel();
    } else {
      openChatInfoPanel();
    }
  }

  // Round blue 'i' info button in header
  if (el.convInfoBtn) {
    el.convInfoBtn.onclick = () => {
      toggleChatInfoPanel();
    };
  }

  // Toggle sidepanel / group members when clicking conversation details (avatar/name) in header
  const headerDetails = document.querySelector('.conv-details');
  if (headerDetails) {
    headerDetails.onclick = () => {
      if (!state.activeConversationId) return;
      const conv = state.conversations.find((c) => c.id === state.activeConversationId);
      if (conv && conv.type === 'group') {
        openGroupModal();
      } else {
        toggleChatInfoPanel();
      }
    };
  }

  if (el.infoPanelClose) {
    el.infoPanelClose.onclick = () => closeChatInfoPanel();
  }
  if (el.infoMediaClose) {
    el.infoMediaClose.onclick = () => closeChatInfoPanel();
  }
  if (el.infoPanelScrim) {
    el.infoPanelScrim.onclick = () => closeChatInfoPanel();
  }
  if (el.infoMediaBack) {
    el.infoMediaBack.onclick = () => {
      if (el.infoPanelMediaView) el.infoPanelMediaView.hidden = true;
      if (el.infoPanelMain) el.infoPanelMain.hidden = false;
    };
  }

  // Media counters click handlers
  if (el.infoRowPhotos) el.infoRowPhotos.onclick = () => openSharedMediaBrowser('photos');
  if (el.infoRowVideos) el.infoRowVideos.onclick = () => openSharedMediaBrowser('videos');
  if (el.infoRowFiles) el.infoRowFiles.onclick = () => openSharedMediaBrowser('files');
  if (el.infoRowVoice) el.infoRowVoice.onclick = () => openSharedMediaBrowser('audio');

  // Bottom action buttons in sidepanel
  if (el.infoActShare) {
    el.infoActShare.onclick = async () => {
      const conv = state.conversations.find((c) => c.id === state.activeConversationId);
      if (conv) {
        try {
          await navigator.clipboard.writeText(`${conv.name} (${conv.phone || ''})`);
          toast('Contact copied to clipboard');
        } catch {
          toast('Contact shared');
        }
      }
    };
  }

  if (el.infoActDeleteChat) {
    el.infoActDeleteChat.onclick = () => {
      closeChatInfoPanel();
      if (!state.activeConversationId) return;
      if (el.deleteConvDialog) el.deleteConvDialog.showModal();
    };
  }

  if (el.infoActBlock) {
    el.infoActBlock.onclick = async () => {
      const conv = state.conversations.find((c) => c.id === state.activeConversationId);
      if (!conv || !conv.otherUserId) return;
      if (confirm(`Block ${conv.name}? You will no longer receive messages from this contact.`)) {
        try {
          await api(`/api/friends/${conv.otherUserId}`, { method: 'DELETE' });
          toast(`Blocked ${conv.name}`);
          closeChatInfoPanel();
          loadFriends();
          loadConversations();
        } catch (e) {
          toast(e.message);
        }
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
        closeChatInfoPanel();

        state.activeConversationId = null;
        if (el.convDropdown) el.convDropdown.hidden = true;
        el.manageGroupBtn.hidden = true;
        if (el.convInfoBtn) el.convInfoBtn.hidden = true;
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

  function renderGroupAvatarPreview() {
    if (!el.groupAvatarPreview) return;
    const conv = state.conversations.find((c) => c.id === state.activeConversationId);
    if (!conv) return;
    if (conv.avatarUrl) {
      renderAvatar(el.groupAvatarPreview, conv.name, conv.avatarColor || 0, conv.avatarUrl, false);
      el.groupAvatarPreview.classList.add('large');
      if (el.groupRemovePicBtn) el.groupRemovePicBtn.hidden = false;
    } else {
      el.groupAvatarPreview.className = `avatar c-${conv.avatarColor || 0} large`;
      el.groupAvatarPreview.textContent = '👥';
      if (el.groupRemovePicBtn) el.groupRemovePicBtn.hidden = true;
    }
  }

  function openGroupModal() {
    if (!state.activeConversationId) return;
    el.addMemberError.textContent = '';
    renderGroupAvatarPreview();
    el.groupMembersDialog.showModal();
    loadGroupMembers();
  }

  // Group Members modal
  if (el.manageGroupBtn) {
    el.manageGroupBtn.onclick = () => openGroupModal();
  }

  if (el.groupUploadTrigger) {
    el.groupUploadTrigger.onclick = () => el.groupPicInput && el.groupPicInput.click();
  }

  if (el.groupPicInput) {
    el.groupPicInput.onchange = async () => {
      const file = el.groupPicInput.files && el.groupPicInput.files[0];
      if (!file) return;
      toast('Uploading group photo…');
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
        const newAvatarUrl = data.url;

        await api(`/api/conversations/${state.activeConversationId}/avatar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: newAvatarUrl }),
        });

        const conv = state.conversations.find((c) => c.id === state.activeConversationId);
        if (conv) conv.avatarUrl = newAvatarUrl;
        renderGroupAvatarPreview();
        if (conv && conv.id === state.activeConversationId) {
          renderAvatar(el.convAvatar, conv.name, conv.avatarColor || 0, newAvatarUrl, false);
        }
        renderConversations();
        toast('Group photo updated!');
      } catch (err) {
        toast(err.message || 'Could not update group photo.');
      } finally {
        el.groupPicInput.value = '';
      }
    };
  }

  if (el.groupRemovePicBtn) {
    el.groupRemovePicBtn.onclick = async () => {
      try {
        await api(`/api/conversations/${state.activeConversationId}/avatar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: null }),
        });
        const conv = state.conversations.find((c) => c.id === state.activeConversationId);
        if (conv) conv.avatarUrl = null;
        renderGroupAvatarPreview();
        if (conv && conv.id === state.activeConversationId) {
          el.convAvatar.className = `avatar c-${conv.avatarColor || 0}`;
          el.convAvatar.textContent = '👥';
        }
        renderConversations();
        toast('Group photo removed.');
      } catch (err) {
        toast(err.message || 'Could not remove group photo.');
      }
    };
  }

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
      const phone = getNormalizedPhone(el.newMemberCountry, el.newMemberPhone);
      if (!phone) throw new Error('Please enter a valid phone number');
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

  async function loadAdminStats() {
    try {
      const data = await api('/api/admin/stats');
      if (el.statUsers) el.statUsers.textContent = data.stats.totalUsers;
      if (el.statOnline) el.statOnline.textContent = data.stats.activeUsersOnline;
      if (el.statMessages) el.statMessages.textContent = data.stats.totalMessages;
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
          const actionWrap = document.createElement('div');
          actionWrap.style.display = 'flex';
          actionWrap.style.alignItems = 'center';
          actionWrap.style.gap = '6px';

          const btn = document.createElement('button');
          btn.className = `btn-suspend ${u.isSuspended ? 'unsuspend' : ''}`;
          btn.textContent = u.isSuspended ? 'Unblock' : 'Block';
          btn.onclick = () => toggleSuspendUser(u.id, !u.isSuspended);
          actionWrap.appendChild(btn);

          const delBtn = document.createElement('button');
          delBtn.className = 'btn-delete-user danger';
          delBtn.textContent = 'Delete Account';
          delBtn.title = 'Permanently delete this user account and all their chat history';
          delBtn.onclick = () => deleteUserAccount(u.id, u.name);
          actionWrap.appendChild(delBtn);

          tdAction.appendChild(actionWrap);
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

  async function deleteUserAccount(userId, userName) {
    const confirmed = window.confirm(
      `Are you sure you want to PERMANENTLY delete user "${userName}"?\n\nThis will delete all their messages, conversations, and uploaded media files without leaving any trace.`
    );
    if (!confirmed) return;

    try {
      await api(`/api/admin/users/${userId}`, { method: 'DELETE' });
      toast(`User "${userName}" and all chat history permanently deleted.`);
      loadAdminUsers();
      loadAdminStats();
      loadConversations();
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
    adjustInputHeight();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDropdowns();
      if (state.replyTarget) cancelReply();
      if (state.editingTarget) cancelEdit();
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.msg-menu-wrap') && !e.target.closest('.chat-item-menu-wrap') && !e.target.closest('.reaction-full-picker-popover')) {
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
  adjustInputHeight();
  checkInitialAuth();
})();
