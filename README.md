# chatbox

A small self-hosted real-time chat: rooms, message history, who is online, typing indicators, light and dark themes.

- **Server:** Node.js, Express, Socket.IO
- **Database:** PostgreSQL (`pg`); tables `chat_rooms` and `chat_messages`, created automatically
- **Client:** plain HTML, CSS and JavaScript (no build step). Fonts are self-hosted.
- **Deployed at:** `https://abirdroid.ddns.net/chatbox` (a subpath, handled for you; see below)

## Project layout

```
chatbox/
├── server.js            Express + Socket.IO + PostgreSQL, subpath handling
├── views/index.html     page template ({{BASE}} is filled in from APPLICATION_ROOT)
├── public/              app.js, app.css, theme.js, favicon.svg, fonts/
├── Dockerfile           production image for Coolify
├── .env.example         copy to .env for local development
└── package.json
```

## 1. Database

Create a database and user once (adjust the password):

```sql
CREATE USER chatbox WITH PASSWORD 'change-me';
CREATE DATABASE chatbox OWNER chatbox;
```

The app creates its own tables on start. Its tables are prefixed `chat_`, so it can share a database with other apps.

Connection string format: `postgres://chatbox:change-me@HOST:5432/chatbox`

## 2. Run locally (dev machine)

Needs Node.js 22.9 or newer (`node -v`).

```powershell
cd F:\my_projects\chatbox
npm install
copy .env.example .env      # then edit DATABASE_URL in .env
npm run dev
```

Open http://localhost:3000.

To try the subpath exactly as in production, set `APPLICATION_ROOT=/chatbox` in `.env` and open http://localhost:3000/chatbox.

## 3. Subpath: how `/chatbox` works

The app lives at `https://abirdroid.ddns.net/chatbox`, not at `/`. Two things break under a subpath: routing (the app gets `/chatbox/...` but expects `/...`) and generated URLs (links and API calls pointing at `/...`). chatbox handles both with one environment variable, `APPLICATION_ROOT`, the same pattern as your Flask notes.

| Piece | How it is handled |
|---|---|
| Incoming requests | `server.js` strips `/chatbox` from the URL if it is still there, for normal requests and WebSocket upgrades. It works whether or not Traefik strips the prefix first. |
| Page URLs | `views/index.html` uses `{{BASE}}/static/app.js` etc. The server replaces `{{BASE}}` with the prefix when it starts. |
| Socket.IO | The browser connects with `path: BASE + '/socket.io'`, so it requests `/chatbox/socket.io/`. |
| Fonts inside CSS | Relative URLs (`fonts/...`) resolve next to `app.css`, so they follow the prefix automatically. |
| Health check | `/healthz` (and `/chatbox/healthz`) also checks the database. |

Never write `/chatbox` into code or templates. Set it once as `APPLICATION_ROOT`.

## 4. Deploy with Coolify

1. **Push the project to Git** (GitHub, Gitea, etc.). `node_modules` and `.env` are ignored.
2. **Create the app** in Coolify: New Resource, choose your repository, **Build Pack: Dockerfile**.
3. **Domains:** `https://abirdroid.ddns.net/chatbox`. Coolify creates the Traefik rule with `PathPrefix(`/chatbox`)`.
4. **Ports Exposes:** `3000`.
5. **Strip Prefixes:** leave the default. The app works with it on or off.
6. **Environment Variables** (runtime):
   - `APPLICATION_ROOT=/chatbox`
   - `DATABASE_URL=postgres://chatbox:change-me@HOST:5432/chatbox`
7. **Deploy**, then open `https://abirdroid.ddns.net/chatbox`.

### Reaching PostgreSQL from the container

`HOST` in `DATABASE_URL` depends on where PostgreSQL runs:

- **PostgreSQL is a Coolify database on the same server:** use its internal URL from the database page, and enable **Connect to Predefined Network** on the chatbox app so both share a network.
- **PostgreSQL runs on the host or another machine:** use that machine's IP (for example the server's LAN IP) and make sure `postgresql.conf` has `listen_addresses` set and `pg_hba.conf` allows the Docker network. `localhost` inside a container means the container itself, not the host.

### Internet access for `abirdroid.ddns.net`

Forward ports 80 and 443 on your router to the Coolify server. Traefik gets the HTTPS certificate automatically, which needs port 80 reachable from the internet.

### Multiple apps on one domain

Each app gets its own `PathPrefix` and its own `APPLICATION_ROOT`. Do not give two apps the same prefix.

## Configuration

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | none (required) | PostgreSQL connection string |
| `APPLICATION_ROOT` | empty | Subpath such as `/chatbox` |
| `PORT` | `3000` | Port the server listens on |
| `HOST` | `0.0.0.0` | Address the server binds to |
| `PGSSL` | off | Set `true` if PostgreSQL requires TLS |
| `PGSSL_REJECT_UNAUTHORIZED` | on | Set `false` for self-signed certificates |

## Behaviour and limits

- Display names: 2 to 24 characters (letters in any language, numbers, spaces, `.` `_` `-`). There are no accounts or passwords, so anyone can use any name.
- Room names: 1 to 24 lowercase letters, numbers, `-` or `_`. Up to 40 rooms.
- Messages: up to 1000 characters; a burst of 6, then one per second per connection.
- History: the last 100 messages are loaded when you join a room; the last 500 per room are kept.
- Run a single instance. Running several would need the Socket.IO Redis adapter.

## Credits

Fonts: Figtree and Bricolage Grotesque, both under the SIL Open Font License (licenses are in `public/fonts/`).
