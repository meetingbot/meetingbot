FROM --platform=linux/amd64 ghcr.io/puppeteer/puppeteer:latest

ENV \
    # Configure default locale (important for chrome-headless-shell).
    LANG=en_US.UTF-8 \
    # UID of the non-root user 'pptruser'
    PPTRUSER_UID=10042 \
    # Set the Chrome path to match the actual installation
    PUPPETEER_EXECUTABLE_PATH=/home/pptruser/.cache/puppeteer/chrome/linux-134.0.6998.35/chrome-linux64/chrome

# Stay as root for all installation steps
USER root

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY zoom/package.json zoom/pnpm-lock.yaml ./zoom/

# Install dependencies as root
RUN pnpm install --filter "@bots/zoom" --filter "bots"

# Install browser
RUN pnpm dlx puppeteer browsers install chrome

# Copy the rest of the application files last
COPY src ./src
COPY zoom/src ./zoom/src

# Change ownership of all files after installation
RUN chown -R pptruser:pptruser /app

# Switch to pptruser for running the application
USER pptruser

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["pnpm", "run", "dev"]