# chatbox

[![Download Android APK](https://img.shields.io/badge/Download-Android%20APK-brightgreen?logo=android&style=for-the-badge)](https://github.com/Abir-droid/chatbox/releases/latest)

A self-hosted, full-featured real-time chat application with phone number authentication, 1-on-1 direct messaging, group chats, friend lists, emoji & media (photo/video), soft deletion, browser notifications, and an administrator audit & moderation dashboard.

### 📱 Android Mobile App
Download and install the latest APK directly on any Android device:
- **Direct Download:** [Chatbox.apk](https://github.com/Abir-droid/chatbox/releases/latest/download/Chatbox.apk)
- **Releases Section:** [All Releases & Changelog](https://github.com/Abir-droid/chatbox/releases)

---

- **Server:** Node.js, Express, Socket.IO, Multer
- **Database:** PostgreSQL (`pg`), prefixed `chat_*` tables created automatically
- **Client:** Modern responsive web application (HTML5, CSS3, JavaScript, Web Audio API, Web Notifications API). Fonts and assets are self-hosted.
- **Subpath ready:** Designed for `https://abirdroid.ddns.net/chatbox` and Coolify reverse proxies (Traefik).

---

## Features

1. **Phone Number Authentication**:
   - Unique phone number registration & login with secure password hashing (`scrypt`).
   - The phone number serves as each user's unique identifier.
   - The first registered user (or the user matching `ADMIN_PHONE`) automatically receives administrator rights.

2. **Group Chats**:
   - Create groups and add members by phone number.
   - Member management dialog showing all participants, roles (admin/member), and online status.

3. **1-on-1 Direct Messaging & Friends List**:
   - Chat privately with multiple users separately by their phone number.
   - Dedicated "Friends" tab to save contacts and view their real-time online status.

4. **Administrator Audit & Moderation Dashboard**:
   - Dedicated dashboard accessible only to admin users (`is_admin: true`).
   - Overview metrics: Total Users, Online Users, Total Messages, Deleted Messages, Groups & DMs.
   - **User Moderation**: View all registered users, message counts, and toggle Block/Suspend. Suspended accounts are immediately disconnected and barred from logging in.
   - **Chat History Audit**: Audit any conversation's complete message history, **including soft-deleted messages** flagged with `[DELETED BY USER]` badges and timestamps.

5. **Emoji & Media Sending (Photos & Videos)**:
   - Built-in popup emoji picker with smileys, gestures, and everyday icons.
   - Attach photos (`jpg, png, gif, webp`) and videos (`mp4, webm, mov`).
   - Instant in-app previews: Photos open in a lightbox viewer; videos play directly inside chat bubbles.

6. **Browser & Audio Notifications**:
   - Web Notifications API integration: Receive desktop notifications when messages arrive while the tab is in the background or when viewing another chat.
   - Synthesized gentle audio chime for incoming messages.

7. **1-on-1 Voice & Video Calling (WebRTC)**:
   - High-definition peer-to-peer audio and video calls directly from direct message conversations.
   - Socket.IO signaling with automatic timeout handling, busy detection, and graceful disconnect cleanup.
   - In-app incoming call dialog with synthesized melodic ringtones, mobile vibration, and answer/decline controls.
   - Floating call overlay with microphone mute/unmute, camera toggle, mobile front/back camera flip, screen sharing, duration timer, and minimize-to-widget mode.

8. **Progressive Web App (PWA) & Browser Installability**:
   - Installable across all major browsers on **Phone** (Android Chrome/Samsung Internet, iOS Safari via "Add to Home Screen") and **PC** (Windows Chrome/Edge, macOS Chrome/Edge/Safari, Linux).
   - Serves dynamically scoped `manifest.webmanifest` and Service Worker (`sw.js`) with support for root and subpath deployments (`APPLICATION_ROOT=/chatbox`).
   - Rich icon bundle with 192x192, 512x512, Apple touch icons (180x180), and Android adaptive maskable icons.
   - Offline fallback page and asset pre-caching for near-instant app shell loading.
   - In-app Install prompt button with native Chromium trigger and iOS Safari guided walkthrough.

9. **Deep Phone & PC Compatibility**:
   - **Phone**: Notch and Dynamic Island safe-area awareness (`env(safe-area-inset-top)` / `bottom`), touch-action manipulation, Android hardware back-button / gesture support (`popstate`), mobile call vibration, and camera flip.
   - **PC / Desktop**: Multi-column responsive layout, Window Controls Overlay (WCO) titlebar support, desktop keyboard shortcuts (`Ctrl+K` to search chats, `Esc` to dismiss modals/previews), and drag-and-drop file upload.

---

## Project layout

```
chatbox/
├── server.js            Express + Socket.IO + PostgreSQL backend
├── routes/              HTTP routes grouped by feature
│   ├── auth.js           Registration, login, and password recovery
│   ├── contacts.js       Profiles, friends, and friend requests
│   ├── conversations.js  Direct and group conversations
│   ├── messages.js       Message history, media, edits, and reactions
│   └── admin.js          Moderation and audit endpoints
├── session.js           Signed session token creation and validation
├── views/index.html     App template (dynamic {{BASE}} for subpaths)
├── public/
│   ├── app.js           Frontend application logic (PWA, WebRTC, realtime)
│   ├── app.css          Responsive stylesheet (Light/Dark themes, safe areas)
│   ├── sw.js            Service worker for offline caching & notifications
│   ├── manifest.webmanifest Web App Manifest template
│   ├── offline.html     Offline fallback page
│   ├── theme.js         FOUC-preventing theme loader
│   ├── favicon.svg      Vector icon
│   ├── icons/           PWA icon set (192x192, 512x512, maskable, apple-touch)
│   ├── fonts/           Self-hosted Figtree & Bricolage Grotesque fonts
│   └── uploads/         Uploaded media files (.gitignored)
├── test/                Unit & PWA integration tests (npm test)
├── docs/architecture.md Project map and deployment notes
├── Dockerfile           Alpine production container for Coolify
├── .env.example         Environment template
└── package.json
```

---

## Run Locally

Requirements: Node.js 22.9+ (`node -v`).

```powershell
# 1. Install dependencies
npm install

# 2. Run the automated session token tests
npm test

# 3. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

*(To test the subpath locally, set `APPLICATION_ROOT=/chatbox` in `.env` and visit `http://localhost:3000/chatbox`)*

---

## Coolify Deployment Settings

| Setting in Coolify | Value |
|---|---|
| **Build Pack** | `Dockerfile` |
| **Domain** | `https://abirdroid.ddns.net/chatbox` |
| **Ports Exposes** | `3000` |
| **Environment Variables** | `APPLICATION_ROOT=/chatbox`<br>`DATABASE_URL=postgres://user:password@pg-host:5432/chatbox`<br>`ADMIN_PHONE=+1234567890` *(optional; designates initial admin)* |

The session signing key is generated once and stored in PostgreSQL automatically. Existing Coolify deployments need no new setting. If you choose to set `SESSION_SECRET`, use the same unique value (at least 32 characters) on every app replica.
