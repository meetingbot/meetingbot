FROM --platform=linux/amd64 ghcr.io/puppeteer/puppeteer:latest

ENV \
    # Configure default locale (important for chrome-headless-shell).
    LANG=en_US.UTF-8 \
    # UID of the non-root user 'pptruser'
    PPTRUSER_UID=10042

# Install pnpm
USER root
RUN npm install -g pnpm
USER $PPTRUSER_UID

# Set working directory
WORKDIR /home/pptruser

# Copy files
COPY package.json pnpm-lock.yaml ./
COPY teams/package.json teams/pnpm-lock.yaml ./teams/
COPY src ./src
COPY teams/src ./teams/src

# Install dependencies inside the container
RUN pnpm install --frozen-lockfile

# Change ownership of the files
USER root
RUN chown -R pptruser:pptruser .
USER $PPTRUSER_UID

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["pnpm", "--filter", "@bots/teams", "run", "dev"]