# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build the application
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Production runner
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy build output and static files
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy standalone output (if using output: 'standalone' in next.config.js)
# For standard build, we copy .next and node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["npm", "start"]
