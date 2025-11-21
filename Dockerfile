# ===================================
# Multi-stage Dockerfile for Next.js
# with pnpm monorepo support
# ===================================

# Base stage with Node.js and pnpm
FROM node:18-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate
ENV PNPM_HOME=/usr/local/bin

# Dependencies stage - Install all dependencies
FROM base AS deps
WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc* ./

# Copy package.json files from all workspaces
COPY apps/web/package.json ./apps/web/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/utils/package.json ./packages/utils/package.json

# Install dependencies
RUN pnpm install --frozen-lockfile

# Builder stage - Build the application
FROM base AS builder
WORKDIR /app

# Accept NODE_ENV as build argument
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Copy source code first
COPY . .

# Copy node_modules from deps stage, preserving pnpm workspace structure
# Copy root node_modules with .pnpm store
COPY --from=deps /app/node_modules ./node_modules
# Copy workspace-specific node_modules (symlinks to .pnpm store)
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=deps /app/packages/utils/node_modules ./packages/utils/node_modules

# Build the web app (packages are TypeScript source, no build needed)
WORKDIR /app/apps/web
RUN pnpm build
WORKDIR /app

# Runner stage - Production image
FROM base AS runner
WORKDIR /app

# Accept NODE_ENV as build argument
ARG NODE_ENV=production

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set environment
ENV NODE_ENV=${NODE_ENV}
ENV PORT=4200
ENV HOSTNAME="0.0.0.0"

# Copy necessary files
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Set ownership
RUN chown -R nextjs:nodejs /app

# Switch to nextjs user
USER nextjs

# Expose port
EXPOSE 4200

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4200/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start the application
CMD ["node", "apps/web/server.js"]
