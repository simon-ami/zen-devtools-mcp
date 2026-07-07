# Build stage
FROM node:22-bookworm AS builder

# Install build dependencies
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Production stage
FROM node:22-bookworm

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN groupadd -g 1001 -r nodejs && \
    useradd -r -g nodejs -u 1001 -m -d /home/nodejs nodejs

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app

USER nodejs

# Set environment variables
ENV NODE_ENV=production \
    ZEN_HEADLESS=true \
    ZEN_PATH= \
    VIEWPORT=1280x720 \
    AUTO_PROFILE=true

# MCP server runs on stdio (no port exposure needed)
# This image does not bundle Zen Browser. Mount or install Zen and set ZEN_PATH.

# Start the MCP server
CMD ["node", "dist/index.js"]
