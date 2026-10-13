(() => {
  'use strict';

  /* The server writes the subpath ("" or "/chatbox") into <meta name="app-base">.
     Every URL below is built from it, so nothing here is hardcoded to /chatbox. */
  const metaBase = document.querySelector('meta[name="app-base"]');
  const BASE = ((metaBase && metaBase.content) || '').replace(/\/+$/, '');

  const KEYS = { name: 'chatbox.name', room: 'chatbox.room', theme: 'chatbox.theme' };
  const DEFAULT_ROOM = 'general';
  const MAX_TEXT = 1000;
  const GROUP_GAP_MS = 5 * 60 * 1000;
  const TYPING_IDLE_MS = 3000;
  const TYPING_EXPIRE_MS = 4500;
  const HUES = [8, 28, 48, 96, 150, 188, 214, 252, 282, 322];
  const NAME_RE = /^[\p{L}\p{N}][\p{L}\p{M}\p{N} ._-]*$/u;

  const $ = (id) => document.getElementById(id);
  const el = {
    app: $('app'), rail: $('rail'), scrim: $('scrim'), menuBtn: $('menu-btn'),
    roomList: $('room-list'), roomForm: $('room-form'), roomInput: $('room-input'),
    userList: $('user-list'),
    meBtn: $('me-btn'), meAvatar: $('me-avatar'), meName: $('me-name'),
    themeBtn: $('theme-btn'), iconMoon: $('icon-moon'), iconSun: $('icon-sun'),
    roomTitle: $('room-title'), status: $('status'), statusText: $('status-text'),
    banner: $('banner'), log: $('log'), messages: $('messages'),
    empty: $('empty'), emptyRoom: $('empty-room'),
    jump: $('jump'), jumpText: $('jump-text'),
    typing: $('typing'), composer: $('composer'), input: $('input'), counter: $('counter'), send: $('send'),
    dialog: $('profile-dialog'), profileForm: $('profile-form'), nameInput: $('name-input'),
    nameError: $('name-error'), profileCancel: $('profile-cancel'), profileSubmit: $('profile-submit'),
    toasts: $('toasts'),
  };

  const store = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* storage blocked */ } },
  };

  const state = {
    name: store.get(KEYS.name) || '',
    room: store.get(KEYS.room) || DEFAULT_ROOM,
    joined: false,
    sending: false,
    everConnected: false,
    rooms: [],
    users: [],
    typers: new Map(), // name -> expiry timer
    last: null, // { user, ts, body } for grouping consecutive messages
    lastDay: '',
    unseen: 0,
    pending: null, // { room, msgs }: messages that arrive while a join is still loading history
    typingSent: false,
    typingTimer: null,
    typingLastSent: 0,
  };

  /* ------------------------------------------------------------- utilities */

  function hueFor(name) {
    let h = 0;
    for (const ch of name) h = (h * 31 + ch.codePointAt(0)) >>> 0;
    return HUES[h % HUES.length];
  }

  function initialOf(name) {
    return (Array.from(name.trim())[0] || '?').toUpperCase();
  }

  function paintAvatar(node, name) {
    node.classList.add('u');
    node.style.setProperty('--h', String(hueFor(name)));
    node.textContent = initialOf(name);
  }

  const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
  const fullFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' });
  const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  function dayKey(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  function dayLabel(ts) {
    const now = Date.now();
    if (dayKey(ts) === dayKey(now)) return 'Today';
    if (dayKey(ts) === dayKey(now - 86400000)) return 'Yesterday';
    return dayFmt.format(ts);
  }

  function toast(text) {
    const node = document.createElement('div');
    node.className = 'toast';
    node.textContent = text;
    el.toasts.appendChild(node);
    setTimeout(() => node.remove(), 4500);
    while (el.toasts.children.length > 3) el.toasts.firstChild.remove();
  }

  /* Plain text with clickable http(s) links. Built with DOM nodes (never innerHTML), so it is XSS-safe. */
  const URL_RE = /https?:\/\/[^\s<>"']*[^\s<>"'.,;:!?)\]}]/gi;
  function fillText(node, text) {
    let cursor = 0;
    for (const match of text.matchAll(URL_RE)) {
      if (match.index > cursor) node.append(text.slice(cursor, match.index));
      const a = document.createElement('a');
      a.href = match[0];
      a.textContent = match[0];
      a.target = '_blank';
      a.rel = 'noopener noreferrer nofollow';
      node.append(a);
      cursor = match.index + match[0].length;
    }
    if (cursor < text.length) node.append(text.slice(cursor));
  }

  /* -------------------------------------------------------------- status UI */

  function setStatus(kind) {
    const labels = { connecting: 'Connecting…', online: 'Connected', offline: 'Reconnecting…' };
    el.status.dataset.state = kind;
    el.statusText.textContent = labels[kind];
    el.banner.hidden = !(kind === 'offline' && state.everConnected);
  }

  function updateComposer() {
    const ready = state.joined;
    el.input.disabled = !ready;
    el.send.disabled = !ready || state.sending || el.input.value.trim() === '';
    el.input.placeholder = ready ? `Message #${state.room}` : 'Connecting…';
  }

  function updateCounter() {
    const len = el.input.value.length;
    el.counter.hidden = len < MAX_TEXT * 0.8;
    el.counter.textContent = `${len}/${MAX_TEXT}`;
    el.counter.dataset.near = String(len >= MAX_TEXT * 0.95);
  }

  function autosize() {
    el.input.style.height = 'auto';
    el.input.style.height = `${Math.min(el.input.scrollHeight, 160)}px`;
  }

  /* --------------------------------------------------------- rooms & people */

  function renderRooms() {
    el.roomList.replaceChildren();
    const rooms = state.rooms.length ? state.rooms : [{ name: state.room, online: 0 }];
    for (const room of rooms) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'room';
      btn.setAttribute('aria-current', String(room.name === state.room));
      btn.dataset.room = room.name;

      const hash = document.createElement('span');
      hash.className = 'room-hash';
      hash.textContent = '#';
      const name = document.createElement('span');
      name.className = 'room-name';
      name.textContent = room.name;
      const count = document.createElement('span');
      count.className = 'room-count';
      count.dataset.zero = String(room.online === 0);
      count.textContent = String(room.online);
      count.setAttribute('aria-label', `${room.online} online`);

      btn.append(hash, name, count);
      li.appendChild(btn);
      el.roomList.appendChild(li);
    }
  }

  function renderUsers() {
    el.userList.replaceChildren();
    for (const name of state.users) {
      const li = document.createElement('li');
      li.className = 'user';
      const avatar = document.createElement('span');
      avatar.className = 'avatar';
      avatar.setAttribute('aria-hidden', 'true');
      paintAvatar(avatar, name);
      const label = document.createElement('span');
      label.className = 'user-name';
      label.textContent = name;
      li.append(avatar, label);
      if (name === state.name) {
        const you = document.createElement('span');
        you.className = 'user-you';
        you.textContent = 'you';
        li.appendChild(you);
      }
      el.userList.appendChild(li);
    }
  }

  function renderMe() {
    el.meName.textContent = state.name || 'Guest';
    paintAvatar(el.meAvatar, state.name || '?');
  }

  function renderRoomHeader() {
    el.roomTitle.textContent = state.room;
    el.emptyRoom.textContent = state.room;
    document.title = `#${state.room} · chatbox`;
  }

  /* --------------------------------------------------------------- messages */

  function nearBottom() {
    return el.log.scrollHeight - el.log.scrollTop - el.log.clientHeight < 90;
  }

  function scrollToBottom(smooth) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.log.scrollTo({ top: el.log.scrollHeight, behavior: smooth && !reduce ? 'smooth' : 'instant' });
    state.unseen = 0;
    el.jump.hidden = true;
  }

  function clearThread() {
    el.messages.replaceChildren();
    state.last = null;
    state.lastDay = '';
    state.unseen = 0;
    el.jump.hidden = true;
    el.empty.hidden = false;
  }

  function addDaySeparator(ts) {
    const key = dayKey(ts);
    if (key === state.lastDay) return;
    state.lastDay = key;
    state.last = null;
    const li = document.createElement('li');
    li.className = 'day';
    li.textContent = dayLabel(ts);
    el.messages.appendChild(li);
  }

  function makeBubble(msg) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.title = fullFmt.format(msg.ts);
    fillText(bubble, msg.text);
    return bubble;
  }

  function addMessage(msg) {
    el.empty.hidden = true;
    addDaySeparator(msg.ts);
    const own = msg.user === state.name;
    const last = state.last;

    if (last && last.user === msg.user && msg.ts - last.ts < GROUP_GAP_MS) {
      last.body.appendChild(makeBubble(msg));
      last.ts = msg.ts;
      return own;
    }

    const li = document.createElement('li');
    li.className = own ? 'msg own u' : 'msg u';
    li.style.setProperty('--h', String(hueFor(msg.user)));

    if (!own) {
      const avatar = document.createElement('span');
      avatar.className = 'avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = initialOf(msg.user);
      li.appendChild(avatar);
    }

    const body = document.createElement('div');
    body.className = 'msg-body';
    const meta = document.createElement('div');
    meta.className = 'msg-meta';
    const name = document.createElement('span');
    name.className = 'msg-name';
    name.textContent = own ? 'You' : msg.user;
    const time = document.createElement('time');
    time.className = 'msg-time';
    time.dateTime = new Date(msg.ts).toISOString();
    time.textContent = timeFmt.format(msg.ts);
    meta.append(name, time);
    body.append(meta, makeBubble(msg));
    li.appendChild(body);
    el.messages.appendChild(li);

    state.last = { user: msg.user, ts: msg.ts, body };
    return own;
  }

  function addSystem(text, ts) {
    el.empty.hidden = true;
    addDaySeparator(ts);
    const li = document.createElement('li');
    li.className = 'system';
    li.textContent = text;
    el.messages.appendChild(li);
    state.last = null;
  }

  function renderHistory(history) {
    clearThread();
    for (const msg of history) addMessage(msg);
    scrollToBottom(false);
  }

  function onIncoming(draw) {
    const stick = nearBottom();
    const own = draw();
    if (stick || own === true) {
      scrollToBottom(own === true);
    } else {
      state.unseen += 1;
      el.jumpText.textContent = state.unseen === 1 ? '1 new message' : `${state.unseen} new messages`;
      el.jump.hidden = false;
    }
  }

  /* ---------------------------------------------------------------- typing */

  function renderTyping() {
    const names = [...state.typers.keys()];
    let text = '';
    if (names.length === 1) text = `${names[0]} is typing…`;
    else if (names.length === 2) text = `${names[0]} and ${names[1]} are typing…`;
    else if (names.length > 2) text = 'Several people are typing…';
    el.typing.textContent = text;
  }

  function setTyper(name, typing) {
    clearTimeout(state.typers.get(name));
    if (typing) {
      state.typers.set(name, setTimeout(() => { state.typers.delete(name); renderTyping(); }, TYPING_EXPIRE_MS));
    } else {
      state.typers.delete(name);
    }
    renderTyping();
  }

  function announceTyping(isTyping) {
    if (!state.joined) return;
    const now = Date.now();
    if (isTyping && state.typingSent && now - state.typingLastSent < 2500) return;
    if (!isTyping && !state.typingSent) return;
    state.typingSent = isTyping;
    state.typingLastSent = now;
    socket.emit('typing', isTyping);
  }

  /* ------------------------------------------------------------------ join */

  function joinRoom(room) {
    if (!state.name) { openProfile({ required: true }); return; }
    const pending = { room, msgs: [] };
    state.pending = pending;
    socket.timeout(8000).emit('join', { name: state.name, room }, (err, res) => {
      if (state.pending === pending) state.pending = null;
      if (err) { toast('The server is slow to respond. Check your connection.'); return; }
      if (!res || !res.ok) { onJoinError(res || {}); return; }

      state.name = res.name;
      state.room = res.room;
      state.users = res.users;
      state.rooms = res.rooms;
      state.joined = true;
      state.typers.forEach((timer) => clearTimeout(timer));
      state.typers.clear();
      state.typingSent = false;
      store.set(KEYS.name, state.name);
      store.set(KEYS.room, state.room);

      renderMe();
      renderRoomHeader();
      renderRooms();
      renderUsers();
      renderTyping();
      renderHistory(res.history);
      // Live messages that arrived while history was loading: show the ones history did not include.
      const lastId = res.history.length ? res.history[res.history.length - 1].id : 0;
      for (const msg of pending.msgs) {
        if (msg.room === state.room && msg.id > lastId) addMessage(msg);
      }
      if (pending.msgs.length) scrollToBottom(false);
      updateComposer();
      updateCounter();
    });
  }

  function onJoinError(res) {
    if (res.code === 'name') {
      openProfile({ required: true, error: res.error });
    } else if (res.code === 'room' || res.code === 'limit') {
      toast(res.error);
      if (state.room !== DEFAULT_ROOM && !state.joined) joinRoom(DEFAULT_ROOM);
    } else {
      toast(res.error || 'Could not join the room.');
    }
  }

  function switchRoom(room) {
    closeRail();
    if (room === state.room && state.joined) return;
    joinRoom(room);
  }

  /* ---------------------------------------------------------------- sending */

  function sendMessage() {
    const text = el.input.value.trim();
    if (!text || !state.joined || state.sending) return;
    if (text.length > MAX_TEXT) { toast(`Messages can be up to ${MAX_TEXT} characters.`); return; }

    state.sending = true;
    updateComposer();
    clearTimeout(state.typingTimer);
    announceTyping(false);

    socket.timeout(6000).emit('message', { text }, (err, res) => {
      state.sending = false;
      if (err) {
        toast('No confirmation from the server. Your message may not have been sent.');
      } else if (!res || !res.ok) {
        toast((res && res.error) || 'The message could not be sent.');
      } else {
        el.input.value = '';
        autosize();
        updateCounter();
      }
      updateComposer();
      el.input.focus();
    });
  }

  /* ---------------------------------------------------------------- profile */

  function openProfile({ required = false, error = '' } = {}) {
    if (!el.dialog.open) {
      el.nameInput.value = state.name;
      el.dialog.showModal();
    }
    el.nameError.textContent = error;
    el.profileCancel.hidden = required || !state.name;
    el.profileSubmit.textContent = state.name ? 'Save name' : 'Join chat';
    el.nameInput.focus();
    el.nameInput.select();
  }

  function submitProfile(event) {
    event.preventDefault();
    const name = el.nameInput.value.normalize('NFC').replace(/\s+/g, ' ').trim();
    if (name.length < 2 || name.length > 24 || !NAME_RE.test(name)) {
      el.nameError.textContent = 'Use 2–24 characters: letters, numbers, spaces, dots, dashes or underscores.';
      el.nameInput.focus();
      return;
    }
    state.name = name;
    store.set(KEYS.name, name);
    el.dialog.close();
    renderMe();
    if (socket.connected) joinRoom(state.room);
  }

  /* ------------------------------------------------------------ side panel */

  function openRail() {
    el.app.classList.add('rail-open');
    el.scrim.hidden = false;
    el.menuBtn.setAttribute('aria-expanded', 'true');
  }
  function closeRail() {
    el.app.classList.remove('rail-open');
    el.scrim.hidden = true;
    el.menuBtn.setAttribute('aria-expanded', 'false');
  }

  /* ------------------------------------------------------------------ theme */

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  function effectiveTheme() {
    const set = document.documentElement.getAttribute('data-theme');
    return set === 'dark' || set === 'light' ? set : (prefersDark.matches ? 'dark' : 'light');
  }
  function paintThemeButton() {
    const dark = effectiveTheme() === 'dark';
    el.iconMoon.hidden = dark;
    el.iconSun.hidden = !dark;
    const label = dark ? 'Switch to light theme' : 'Switch to dark theme';
    el.themeBtn.setAttribute('aria-label', label);
    el.themeBtn.title = label;
  }
  function toggleTheme() {
    const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    store.set(KEYS.theme, next);
    paintThemeButton();
  }

  /* ----------------------------------------------------------------- socket */

  // The path carries the subpath. Behind Traefik this becomes /chatbox/socket.io/ for polling and WebSocket.
  const socket = io({ path: `${BASE}/socket.io`, reconnectionDelayMax: 5000 });

  socket.on('connect', () => {
    state.everConnected = true;
    setStatus('online');
    if (state.name) joinRoom(state.room);
    else if (!el.dialog.open) openProfile({ required: true });
  });

  socket.on('disconnect', () => {
    state.pending = null;
    state.joined = false;
    state.sending = false;
    setStatus('offline');
    updateComposer();
  });

  socket.on('connect_error', () => setStatus(state.everConnected ? 'offline' : 'connecting'));
  socket.io.on('reconnect_attempt', () => setStatus('offline'));

  socket.on('message', (msg) => {
    if (state.pending && msg.room === state.pending.room) { state.pending.msgs.push(msg); return; }
    if (!state.joined || msg.room !== state.room) return;
    setTyper(msg.user, false);
    onIncoming(() => addMessage(msg));
  });

  socket.on('system', (evt) => {
    if (!state.joined || evt.room !== state.room) return;
    onIncoming(() => { addSystem(evt.text, evt.ts); return false; });
  });

  socket.on('presence', (evt) => {
    if (evt.room !== state.room) return;
    state.users = evt.users;
    renderUsers();
  });

  socket.on('rooms', (rooms) => {
    state.rooms = rooms;
    renderRooms();
  });

  socket.on('typing', (evt) => {
    if (evt.room !== state.room || evt.user === state.name) return;
    setTyper(evt.user, Boolean(evt.typing));
  });

  /* ----------------------------------------------------------------- events */

  el.roomList.addEventListener('click', (event) => {
    const btn = event.target.closest('button.room');
    if (btn) switchRoom(btn.dataset.room);
  });

  el.roomForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const room = el.roomInput.value.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-');
    if (!/^[a-z0-9][a-z0-9_-]{0,23}$/.test(room)) {
      toast('Room names use 1–24 lowercase letters, numbers, dashes or underscores.');
      el.roomInput.focus();
      return;
    }
    el.roomInput.value = '';
    switchRoom(room);
  });

  el.composer.addEventListener('submit', (event) => { event.preventDefault(); sendMessage(); });

  const coarsePointer = window.matchMedia('(pointer: coarse)');
  el.input.addEventListener('keydown', (event) => {
    // Enter sends on desktop; Shift+Enter adds a line. On touch screens Enter always adds a line.
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && !coarsePointer.matches) {
      event.preventDefault();
      sendMessage();
    }
  });
  el.input.addEventListener('input', () => {
    autosize();
    updateCounter();
    updateComposer();
    if (el.input.value.trim()) {
      announceTyping(true);
      clearTimeout(state.typingTimer);
      state.typingTimer = setTimeout(() => announceTyping(false), TYPING_IDLE_MS);
    } else {
      clearTimeout(state.typingTimer);
      announceTyping(false);
    }
  });

  el.log.addEventListener('scroll', () => { if (nearBottom()) { state.unseen = 0; el.jump.hidden = true; } }, { passive: true });
  el.jump.addEventListener('click', () => { scrollToBottom(true); el.input.focus(); });

  el.menuBtn.addEventListener('click', openRail);
  el.scrim.addEventListener('click', closeRail);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeRail(); });

  el.meBtn.addEventListener('click', () => { closeRail(); openProfile(); });
  el.profileForm.addEventListener('submit', submitProfile);
  el.profileCancel.addEventListener('click', () => el.dialog.close());
  el.dialog.addEventListener('cancel', (event) => { if (!state.name) event.preventDefault(); });

  el.themeBtn.addEventListener('click', toggleTheme);
  prefersDark.addEventListener('change', paintThemeButton);

  /* ------------------------------------------------------------------- init */

  renderMe();
  renderRoomHeader();
  renderRooms();
  renderUsers();
  paintThemeButton();
  setStatus('connecting');
  updateComposer();
  clearThread();
  if (!state.name) openProfile({ required: true });
})();
