# Build Frontend
FROM node:20-alpine as frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Setup API
FROM node:20-alpine
WORKDIR /usr/src/app

# Copy API dependencies
COPY api/package*.json ./
RUN npm ci --only=production

# Copy API Source
COPY api/ .

# Copy Frontend Build
COPY --from=frontend-builder /app/frontend/dist ../frontend/dist

ENV NODE_ENV=production
CMD ["node", "index.js"]
