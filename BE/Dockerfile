# Alternative Dockerfile for Backend with ML Support
# Uses Python slim image instead of Alpine for better ML library support

# Stage 1: Node.js dependencies
FROM node:22-alpine AS node-deps

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Python ML environment
FROM python:3.11-slim AS python-ml

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    netcat-openbsd \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python ML dependencies
COPY requirements_ml.txt ./
ENV PIP_DEFAULT_TIMEOUT=180
RUN pip3 install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu -r requirements_ml.txt

# Stage 3: Final image with Node.js + Python
FROM python:3.11-slim

# Install Node.js
RUN apt-get update && apt-get install -y \
    curl \
    ffmpeg \
    netcat-openbsd \
    libgl1 \
    libglib2.0-0 \
    && curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Node.js dependencies from stage 1
COPY --from=node-deps /app/node_modules ./node_modules

# Copy Python ML packages from stage 2
COPY --from=python-ml /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=python-ml /usr/local/bin /usr/local/bin

# Copy application code
COPY package*.json ./
COPY . .

# Create necessary directories
RUN mkdir -p detected_plates ml_models/plate_detector

# Copy and setup entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

# Generate Prisma client
RUN npx prisma generate

# Create non-root user and ensure home exists
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs -m backend && \
    mkdir -p /home/backend && chown -R backend:nodejs /home/backend && \
    chown -R backend:nodejs /app && \
    chown backend:nodejs /docker-entrypoint.sh

USER backend

EXPOSE 5000
EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["npm", "start"]
