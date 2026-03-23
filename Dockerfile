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

# Install build tools for better-sqlite3 native bindings
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install backend dependencies with npm (ensures native modules compile)
COPY backend/package.json ./
RUN npm install --omit=dev

# Copy backend source and seed database
COPY backend/src ./src
COPY backend/products.db ./products.db.seed

# Copy frontend build output
COPY --from=frontend-build /app/frontend/dist ./public

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3001
CMD ["node", "src/start.js"]
