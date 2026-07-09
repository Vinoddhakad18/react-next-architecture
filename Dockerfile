# ===================================
# Multi-stage Dockerfile for Next.js
# with pnpm monorepo support
# ===================================
# Base stage with Node.js and pnpm
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
ENV PNPM_HOME=/pnpm
ENV PNPM_STORE_DIR=/pnpm/store
ENV PATH="${PNPM_HOME}:${PATH}"
RUN mkdir -p /pnpm/store \
&& corepack enable \
&& corepack prepare pnpm@9.15.0 --activate \
&& pnpm config set package-import-method copy --global
 
# Dependencies stage - Install all dependencies
FROM base AS deps
WORKDIR /app
# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml .npmrc* ./
# Copy package.json files from all workspaces
COPY apps/web/package.json ./apps/web/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/utils/package.json ./packages/utils/package.json
# Install dependencies into a writable pnpm store inside the image
RUN pnpm install --frozen-lockfile --loglevel=debug
 
# Builder stage - Build the application
FROM base AS builder
WORKDIR /app
# Accept NODE_ENV as build argument
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
# Copy source code first
COPY . .
# Copy node_modules from deps stage, preserving pnpm workspace structure
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=deps /app/packages/utils/node_modules ./packages/utils/node_modules
# Build the web app (packages are TypeScript source, no build needed)
WORKDIR /app/apps/web
RUN pnpm build
WORKDIR /app
 
# Development stage - Reuse deps (no second pnpm install)
FROM deps AS development
# Set environment for development
ENV NODE_ENV=development
ENV PORT=4200
ENV HOSTNAME="0.0.0.0"
ENV WATCHPACK_POLLING=true
ENV CHOKIDAR_USEPOLLING=true
# Expose port
EXPOSE 4200
# Set working directory
WORKDIR /app/apps/web
# Start development server
CMD ["pnpm", "dev"]
 
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
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules
# Set ownership
RUN chown -R nextjs:nodejs /app
# Switch to nextjs user
USER nextjs
# Expose port
EXPOSE 4200
# Set working directory
WORKDIR /app/apps/web
# Start the application
CMD ["pnpm", "start"]