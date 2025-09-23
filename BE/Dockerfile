# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Install netcat for database health check
RUN apk add --no-cache netcat-openbsd

# Copy and make entrypoint script executable
COPY docker-entrypoint.sh /docker-entrypoint.sh
# Normalize line endings and make executable (fix Windows CRLF issue)
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

# Generate Prisma client
RUN npx prisma generate

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Change ownership of app directory
RUN chown -R backend:nodejs /app
RUN chown backend:nodejs /docker-entrypoint.sh
USER backend

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["npm", "start"]
