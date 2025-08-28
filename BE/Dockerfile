FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create .env file from environment variables
RUN echo "DB_HOST=\$DB_HOST" > .env && \
    echo "DB_USER=\$DB_USER" >> .env && \
    echo "DB_PASSWORD=\$DB_PASSWORD" >> .env && \
    echo "DB_DATABASE_NAME=\$DB_DATABASE_NAME" >> .env && \
    echo "DB_PORT=\$DB_PORT" >> .env && \
    echo "DB_DIALECT=\$DB_DIALECT" >> .env && \
    echo "PORT=\$PORT" >> .env && \
    echo "NODE_ENV=\$NODE_ENV" >> .env && \
    echo "JWT_SECRET=\$JWT_SECRET" >> .env && \
    echo "JWT_EXPIRES_IN=\$JWT_EXPIRES_IN" >> .env

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]

