# If you ever do `pnpm install puppeteer@latest` in the future, make sure to update this line as well.
FROM --platform=linux/amd64 ghcr.io/puppeteer/puppeteer:24.7.2

ENV \
    # Configure default locale (important for chrome-headless-shell).
    LANG=en_US.UTF-8 \
    # UID of the non-root user 'pptruser'
    PPTRUSER_UID=10042 \
    # Get meeting platform this file is built for
    DOCKER_MEETING_PLATFORM=teams
    
# Stay as root for all installation steps
USER root

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /home/pptruser

# Copy files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY teams/package.json teams/pnpm-lock.yaml ./teams/

# Install dependencies as root
RUN pnpm install --filter "@bots/teams" --filter "bots"

# Install browser
RUN pnpm dlx puppeteer browsers install chrome

# Change ownership of all files after installation
RUN chown -R pptruser:pptruser /home/pptruser

#  Copy the rest of the application last
COPY src ./src
COPY teams/src ./teams/src

# Change ownership of working files after installation
RUN chown -R pptruser:pptruser /home/pptruser/src && chmod -R 755 /home/pptruser/src
RUN chown -R pptruser:pptruser /home/pptruser/teams/src && chmod -R 755 /home/pptruser/teams/src


# Switch to pptruser for running the application
USER pptruser

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["pnpm", "run", "dev"]