# Build stage
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production
RUN npx prisma generate

# Production stage
FROM node:18

WORKDIR /app

# Install dumb-init
RUN apt-get update && apt-get install -y dumb-init && apt-get clean

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY . .

# Create non-root user
RUN useradd -m nodejs && chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]

CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
