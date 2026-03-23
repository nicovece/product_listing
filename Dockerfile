# Stage 1: Build frontend
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY frontend/ ./
ENV VITE_API_URL=""
RUN pnpm run build

# Stage 2: Production backend
FROM node:20-slim AS production
WORKDIR /app

# Install pnpm and build tools for better-sqlite3
RUN npm install -g pnpm && apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install backend dependencies
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy backend source
COPY backend/src ./src

# Copy frontend build output
COPY --from=frontend-build /app/frontend/dist ./public

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3001
CMD ["node", "src/start.js"]
