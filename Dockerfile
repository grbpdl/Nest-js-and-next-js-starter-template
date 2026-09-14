# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Reduce flaky registry timeouts during image builds
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5

COPY package.json package-lock.json* ./

RUN npm ci --legacy-peer-deps

COPY . .

RUN npm run build && npm prune --omit=dev --legacy-peer-deps

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

COPY package.json package-lock.json* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

RUN mkdir -p public/uploads && chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]
