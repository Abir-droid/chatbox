# Project map

## Backend

`server.js` is the application entry point. It owns database startup, shared middleware, Socket.IO connections, and graceful shutdown. HTTP endpoints live in `routes/`, grouped by feature:

| File | Responsibility |
|---|---|
| `routes/auth.js` | Registration, login, and password recovery |
| `routes/contacts.js` | Profile updates, friends, and friend requests |
| `routes/conversations.js` | Direct and group conversations, membership, and read state |
| `routes/messages.js` | Message history, media, edits, deletes, and reactions |
| `routes/admin.js` | Moderation and conversation audit |

`server.js` passes each route group the shared services it needs through `routeContext`. Keep feature-specific endpoints in their route file; put shared services and startup behavior in `server.js` or a focused helper module.

Signed-token creation and validation are in `session.js`. The signing key is read from `SESSION_SECRET` when configured; otherwise, startup creates a random key and stores it in the PostgreSQL `chat_app_config` table. This lets existing Coolify deployments keep their current environment settings and lets multiple app instances share the same key through the database.

## Browser app

The page markup is in `views/index.html`, styling is in `public/app.css`, and client behavior is in `public/app.js`. The client currently shares state in one app closure, so keep related UI changes near their feature functions and use the existing `api()` and DOM text APIs when adding behavior. Useful function names to search for include:

- `api`, `login`, `logout`, `connectSocket` for account and connection behavior
- `renderConversations`, `renderMessages`, `createMessageRow` for chat display
- `renderFriends`, `renderFriendRequests` for contacts
- `sendMessage`, `upload`-related handlers, and `renderMediaPreview` for composing and media
- `loadAdminUsers`, `loadAdminStats` for moderation screens

## Deployment

Coolify continues to build from the root `Dockerfile`. The image copies `server.js`, `session.js`, `routes/`, `views/`, and `public/`. Keep that copy list in sync when adding a runtime module. The existing `DATABASE_URL`, `APPLICATION_ROOT`, port, health check, and persistent upload volume remain in use.
