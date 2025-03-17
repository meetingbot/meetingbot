# Use the official Playwright Docker image as the base stage
FROM mcr.microsoft.com/playwright:v1.51.0-jammy AS base

# Install XVFB dependencies
RUN apt-get update && apt-get install -y \
  libx11-dev \
  libxcomposite-dev \
  libxdamage-dev \
  libxrandr-dev \
  x11-xserver-utils \
  xvfb \
  && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

#Install pnpm globally
RUN npm install -g pnpm

# Copy dependency files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY meet/package.json meet/pnpm-lock.yaml ./meet/

# Install dependencies
RUN pnpm install --filter "@bots/meet" --filter "bots"

# Install Playwright dependencies
RUN pnpm dlx playwright@1.51.0 install-deps

# Install Playwright browsers
RUN pnpm dlx playwright@1.51.0 install --with-deps

# Ensure the Playwright cache directory has the correct permissions
RUN mkdir -p /root/ms-playwright && chmod -R 777 /root/ms-playwright

# ======================================================
# Runtime stage
FROM mcr.microsoft.com/playwright:v1.51.0-jammy AS runtime

# Set the working directory inside the container
WORKDIR /app

# Copy node_modules and package.json from the base stage
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/package.json /app/package.json
COPY --from=base /app/pnpm-workspace.yaml /app/pnpm-workspace.yaml
COPY --from=base /app/meet/node_modules /app/meet/node_modules
COPY --from=base /app/meet/package.json /app/meet/package.json
COPY --from=base /app/meet/pnpm-lock.yaml /app/meet/pnpm-lock.yaml
COPY --from=base /root/ms-playwright /root/ms-playwright

# Copy files into the container
COPY src ./src
COPY meet/src ./meet/src

#Install pnpm globally
RUN npm install -g pnpm

# Run Command
CMD ["sh", "-c", "xvfb-run -s '-screen 0 1280x1024x24' pnpm run dev"]
