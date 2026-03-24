# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY frontend/package.json ./frontend/

# Install all deps for shared + frontend
RUN npm ci --workspace=shared --workspace=frontend

# Copy source
COPY shared/ ./shared/
COPY frontend/ ./frontend/

# Build shared first, then frontend
RUN npm run build -w shared && npm run build -w frontend


# Stage 2: Production
FROM node:22-alpine AS production

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

WORKDIR /app

# Copy Next.js standalone output
COPY --from=builder /app/frontend/.next/standalone ./

# Copy static assets into the expected standalone path
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static

# Copy public assets
COPY --from=builder /app/frontend/public ./frontend/public

EXPOSE 3000

CMD ["node", "frontend/server.js"]
