# Cloud backend: Node.js API only. AI inference now runs on the Edge desktop app at each gate.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine
RUN apk add --no-cache curl netcat-openbsd openssl \
    && addgroup -g 1001 nodejs \
    && adduser -S -u 1001 -G nodejs backend
WORKDIR /app
COPY --chown=backend:nodejs --from=deps /app/node_modules ./node_modules
COPY --chown=backend:nodejs . .
# Prisma CLI (devDependency) is kept: the entrypoint runs `prisma db push` on start.
RUN npx prisma generate

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh \
    && chmod +x /docker-entrypoint.sh \
    && mkdir -p /app/evidence \
    && chown backend:nodejs /app /app/evidence

USER backend
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -fsS http://localhost:5000/api/health || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["npm", "start"]
