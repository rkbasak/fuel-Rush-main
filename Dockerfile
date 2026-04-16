# Fuel Rush Dockerfile
# Multi-stage build: Node 22 builder → minimal Node.js runner
# Supports: linux/amd64, linux/arm64

# ─── Stage 1: Builder ───────────────────────────────────────────────────────
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder

ARG BUILDPLATFORM
ARG TARGETOS
ARG TARGETARCH
# Cache buster — change this value to force rebuild
ARG FUEL_VERSION=20260327-2

WORKDIR /app

# Copy package files first (cached)
COPY package.json package-lock.json* ./

# Install deps
RUN npm ci --legacy-peer-deps

# Copy source (invalidate whenever code changes)
COPY . .

# Always run fresh build (standalone needs to be regenerated)
RUN rm -rf .next out && npm run build

# Debug: verify standalone exists
RUN ls -la .next/standalone/ || { echo "ERROR: standalone not found"; ls -la .next/ 2>/dev/null || echo '.next dir missing'; exit 1; }

# ─── Stage 2: Runner ────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache curl

COPY --from=builder /app/.next/standalone ./

COPY --from=builder /app/.next/static ./.next/static

COPY --from=builder /app/public ./

COPY --from=builder /app/package.json ./

RUN npm ci --omit=dev --legacy-peer-deps

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "server.js"]
