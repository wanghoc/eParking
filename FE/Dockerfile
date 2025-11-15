# Multi-stage build for React app
FROM node:22-alpine as build

# Set working directory
WORKDIR /app

# Build-time args for CRA envs
ARG REACT_APP_API_URL
ARG REACT_APP_ENVIRONMENT
ARG REACT_APP_WS_URL

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Set env vars so CRA picks them up at build time
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_ENVIRONMENT=${REACT_APP_ENVIRONMENT}
ENV REACT_APP_WS_URL=${REACT_APP_WS_URL}

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage with Nginx
FROM nginx:1.27-alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built app from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Create non-root user
RUN adduser -S frontend -u 1001

# Set proper permissions
RUN chown -R frontend:nogroup /usr/share/nginx/html && \
    chown -R frontend:nogroup /var/cache/nginx && \
    chown -R frontend:nogroup /var/log/nginx && \
    chown -R frontend:nogroup /etc/nginx/conf.d
RUN touch /var/run/nginx.pid && \
    chown -R frontend:nogroup /var/run/nginx.pid

# Switch to non-root user
USER frontend

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
