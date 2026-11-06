# chatbox

A self-hosted, full-featured real-time chat application with phone number authentication, 1-on-1 direct messaging, group chats, friend lists, emoji & media (photo/video), soft deletion, browser notifications, and an administrator audit & moderation dashboard.

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
   - In-app incoming call dialog with synthesized melodic ringtones and answer/decline controls.
   - Floating call overlay with microphone mute/unmute, camera toggle, screen sharing, duration timer, and minimize-to-widget mode.

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
│   ├── app.js           Frontend application logic
│   ├── app.css          Responsive stylesheet (Light/Dark themes)
│   ├── theme.js         FOUC-preventing theme loader
│   ├── favicon.svg      Vector icon
│   ├── fonts/           Self-hosted Figtree & Bricolage Grotesque fonts
│   └── uploads/         Uploaded media files (.gitignored)
├── test/                Session token tests (npm test)
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
