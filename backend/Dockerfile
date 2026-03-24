# Stage 1: Builder
FROM node:22-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install all deps for shared + backend
RUN npm ci --workspace=shared --workspace=backend

# Copy source
COPY shared/ ./shared/
COPY backend/ ./backend/

# Build shared first, then backend
RUN npm run build -w shared && npm run build -w backend


# Stage 2: Production
FROM node:22-alpine AS production

RUN apk add --no-cache ffmpeg python3 make g++

WORKDIR /app

# Copy workspace manifests
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/

# Install production deps only
RUN npm ci --workspace=shared --workspace=backend --omit=dev && \
    apk del python3 make g++

# Copy compiled output from builder
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/backend/dist ./backend/dist

# Copy entrypoint
COPY backend/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "backend/dist/index.js"]
