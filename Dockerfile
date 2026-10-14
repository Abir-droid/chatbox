# chatbox — production image for Coolify (Dockerfile build pack)
FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install dependencies first so this layer is cached between deploys
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server.js ./
COPY views ./views
COPY public ./public
RUN mkdir -p public/uploads && chown -R node:node public/uploads

USER node

ENV PORT=3000
# Set these in Coolify -> Environment Variables (runtime), not here:
#   APPLICATION_ROOT=/chatbox
#   DATABASE_URL=postgres://user:password@host:5432/chatbox

EXPOSE 3000

# /healthz also checks the database connection
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT}/healthz" >/dev/null || exit 1

CMD ["node", "server.js"]
