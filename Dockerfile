# Use the official Microsoft Playwright image which includes all browsers and graphic libraries
FROM mcr.microsoft.com/playwright:v1.44.0-jammy

# Set working directory
WORKDIR /app

# Copy lockfiles and package configs
COPY package.json package-lock.json turbo.json ./
COPY apps/agent/package.json ./apps/agent/
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
COPY packages/tsconfig/package.json ./packages/tsconfig/

# Install dependencies
RUN npm ci

# Copy full source
COPY . .

# Build applications
RUN npm run build

# Expose backend port
EXPOSE 10000

# Set environment variables
ENV PORT=10000
ENV NODE_ENV=production

# Install xvfb and xauth to run headed Chrome in memory
RUN apt-get update && apt-get install -y xvfb xauth && rm -rf /var/lib/apt/lists/*

# Start server using xvfb virtual display
CMD ["xvfb-run", "--server-args=-screen 0 1280x800x24", "npx", "tsx", "apps/agent/src/server.ts"]
