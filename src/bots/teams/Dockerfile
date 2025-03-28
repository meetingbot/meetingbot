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
COPY teams/package.json teams/pnpm-lock.yaml ./teams/

# Install dependencies as root
RUN pnpm install --filter "@bots/teams" --filter "bots"

# Install browser
RUN pnpm dlx puppeteer browsers install chrome

# Change ownership of all files after installation
RUN chown -R pptruser:pptruser /app

#  Copy the rest of the application last
COPY src ./src
COPY teams/src ./teams/src

# Change ownership of working files after installation
RUN chown -R pptruser:pptruser /app/src && chmod -R 755 /app/src
RUN chown -R pptruser:pptruser /app/teams/src && chmod -R 755 /app/teams/src


# Switch to pptruser for running the application
USER pptruser

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["pnpm", "run", "dev"]