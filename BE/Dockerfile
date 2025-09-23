# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies (including dev dependencies for Prisma generate)
RUN npm install

# Copy Prisma schema first
COPY prisma/ ./prisma/

# Generate Prisma client before copying all source code
RUN npx prisma generate

# Copy source code
COPY . .

# Install netcat for database health check
RUN apk update && apk add --no-cache curl busybox-extras

# Copy and make entrypoint script executable
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Change ownership of app directory
RUN chown -R backend:nodejs /app
RUN chown backend:nodejs /docker-entrypoint.sh

# Remove dev dependencies but keep prisma for runtime
RUN npm prune --omit=dev && npm install prisma @prisma/client

USER backend

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["npm", "start"]
