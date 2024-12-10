# Use the official Playwright Docker image as the base stage
FROM mcr.microsoft.com/playwright:v1.49.1-jammy AS base

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
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Install Playwright dependencies
RUN npx playwright install-deps

# Install Playwright browsers
RUN npx playwright install --with-deps

# Ensure the Playwright cache directory has the correct permissions
RUN mkdir -p /root/.cache/ms-playwright && chmod -R 777 /root/.cache/ms-playwright

# ======================================================
# Runtime stage
FROM mcr.microsoft.com/playwright:v1.49.1-jammy AS runtime

# Set the working directory inside the container
WORKDIR /app

# Copy node_modules and package.json from the base stage
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/package.json /app/package.json
COPY --from=base /root/.cache/ms-playwright /root/.cache/ms-playwright

# Copy files into the container
COPY ./src ./src
COPY .env ./

#Run Commsand
CMD ["sh", "-c", "xvfb-run -s '-screen 0 1280x1024x24' npm run dev"]
