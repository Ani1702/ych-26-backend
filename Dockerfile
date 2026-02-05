# Use official Node.js LTS image (Debian-based for better OpenSSL compatibility)
FROM node:20-slim

# Install OpenSSL and other dependencies
RUN apt-get update -y && \
    apt-get install -y openssl libssl3 ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy application files
COPY . .

# Expose the application port
EXPOSE 8001

# Start the application
CMD ["npm", "start"]
