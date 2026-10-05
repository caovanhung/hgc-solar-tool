# ==========================================
# STAGE 1: Build Frontend Assets
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install all dependencies (including devDependencies for build tools)
RUN npm ci

# Copy source code and build configs
COPY tsconfig*.json vite.config.ts index.html metadata.json server.ts ./
COPY src ./src

# Build production bundle into /app/dist
RUN npm run build

# ==========================================
# STAGE 2: Production Runtime
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled frontend from builder
COPY --from=builder /app/dist ./dist

# Copy production backend server
COPY --from=builder /app/server.ts ./server.ts

# Security: Run as non-root user
USER node

EXPOSE 3000

# Health check to ensure zero-downtime and container orchestration readiness
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.ts"]
