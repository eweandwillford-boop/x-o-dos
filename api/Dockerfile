# Build Frontend
FROM node:20-alpine as frontend-builder
WORKDIR /app

# Copy root config
COPY package*.json ./

# Copy workspace configs (required for npm ci in workspaces)
COPY frontend/package*.json ./frontend/
COPY api/package*.json ./api/
COPY contracts/package*.json ./contracts/

# Install dependencies for all workspaces
RUN npm ci

# Build Frontend
COPY frontend/ ./frontend/
WORKDIR /app/frontend
RUN npm run build

# Setup API
FROM node:20-alpine
WORKDIR /app

# Copy root and workspace configs
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY api/package*.json ./api/
COPY contracts/package*.json ./contracts/

# Install production dependencies
RUN npm ci --omit=dev

# Copy API Source
COPY api/ ./api/

# Copy Frontend Build from builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

WORKDIR /app/api
ENV NODE_ENV=production
CMD ["node", "index.js"]
