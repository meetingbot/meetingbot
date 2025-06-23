# Bot Scripts

This directory serves as the central hub for the bot implementations, which are designed to automate the process of joining and recording virtual meetings across various platforms.

Each bot is responsible for executing the following key tasks:

- **Launching a Browser**: Initiating a browser instance to interact with the meeting platform.
- **Navigating to the Meeting**: Accessing the meeting URL or ID provided in the configuration.
- **Authenticating and Setting Identity**: Entering the required credentials and setting the bot's display name.
- **Joining the Meeting**: Successfully connecting to the meeting session.
- **Recording the Meeting**: Capturing the meeting's audio and/or video content.
- **Uploading the Recording**: Transferring the recorded content to a designated storage location upon completion.
- **Notifying the Backend**: Sending updates to the backend system to reflect the recording status and other relevant details.

These bots are integral to the MeetingBot application, ensuring seamless and automated meeting recording functionality across supported platforms.

## File Structure

```
src/bots/
├── .env.example            # Example environment template file
├── package.json            # Global dependencies
├── pnpm-workspace.yaml     # Specifies sub-workspaces
├── tsconfig.json           # Global ts configurations
├── jest.config.js          # Jest configuration for tests

├── src/
│   ├── index.ts          ! # Main script -- You'll want to look here first!!
│   ├── bot.ts              # Bot related classes and functions
│   ├── monitoring.ts       # Monitoring methods used by main script
│   ├── trpc.ts             # trpc client

├── team|zoom|meet/
│   ├── Dockerfile          # Bot-specific docker file
│   ├── package.json        # Bot-specific dependencies
│   ├── pnpm-lock.yaml
│   ├── tsconfig.json       # Bot-specific ts configurations
│   ├── src/
│   │   ├── bot.ts          # Platform-specific bot class

├── __mocks__/              # Mock implementations for classes
├── tests/                  # Jest test files
```

## Environment

Refer to the `.env.example` file for the required environment variables. Duplicate this file and rename it to `.env`. This `.env` file will be utilized by the application during execution.

The `BOT_DATA` environment variable contains the bot configuration including meeting information. The `meeting_info` object within `BOT_DATA` is used to store the meeting information for the bot to join the meeting. This information is platform dependent, each platform requires different keys in the `meeting_info` object.

You can either use the `set-bot-data` script (recommended) or manually configure the environment as described below.

```bash
cd src/bots

# Set bot data with a Google Meet URL
pnpm set-bot-data "https://meet.google.com/..."

# Set bot data with a Zoom URL
pnpm set-bot-data "https://zoom.us/j/..."

# Set bot data with a Teams URL
pnpm set-bot-data "https://teams.live.com/meet/..."

# Set bot data with a custom callback URL
pnpm set-bot-data "https://meet.google.com/..." "https://mycallback.com/webhook"
```

### Zoom

```json
{
  "meeting_info": {
    "platform": "zoom",
    "meetingId": "<MEETING_ID>",
    "meetingPassword": "<MEETING_PASSWORD>"
  }
}
```

### Google Meet

```json
{
  "meeting_info": {
    "platform": "google",
    "meetingUrl": "<MEETING_LINK>"
  }
}
```

Where Meeting Link is the full URL to the meeting.

### Microsoft Teams

```json
{
  "meeting_info": {
    "platform": "teams",
    "meetingId": "<MEETING_ID>",
    "meetingPassword": "<MEETING_PASSWORD>"
  }
}
```

### Running Bots Locally

First make sure you have the appropriate browsers and ffmpeg installed

```bash
# FOR TEAMS AND ZOOM: ensure that you have installed the puppeteer browsers
cd src/bots/zoom && pnpm exec puppeteer browsers install chrome

# FOR GOOGLE MEETS: ensure that you have installed the playwright browsers and ffmpeg
cd src/bots/meet && pnpm exec playwright install
brew install ffmpeg # learn more at https://ffmpeg.org/download.html
```

Then, you can use the `dev-local` script to run the bot with automatic configuration:

```bash
cd src/bots

# Run a bot locally with a Google Meet URL
pnpm dev-local "https://meet.google.com/<meeting_id>"

# Run a bot locally with a Zoom URL
pnpm dev-local "https://zoom.us/j/<meeting_id>?pwd=<password>"

# Run a bot locally with a Teams URL
pnpm dev-local "https://teams.live.com/meet/<meeting_id>?p=<password>"

# Run with a custom callback URL (defaults to http://localhost:3000/callback)
pnpm dev-local "https://meet.google.com/<meeting_id>" "https://mycallback.com/webhook"
```

Alternatively, you can first set up your `.env` file using `set-bot-data` and then run the regular `pnpm dev` command:

```bash
# First, configure the .env file
pnpm set-bot-data "https://meet.google.com/<meeting_id>"

# Then run the bot
pnpm dev
```

Bot code should work as intended on your environment, but we make no guarentees about this. Instead, you should aim to test and develop your code in the docker environment.

## Building

This section provides instructions for building the Docker images required for the MeetingBot application.
The code below outlines the necessary steps and configurations to create containerized environments
for deploying the bot services.

Ensure that [Docker](https://www.docker.com/) is installed and properly configured on your system before proceeding with the build process.

```bash
cd src/bots
docker build -f meet/Dockerfile -t meet .
docker build -f teams/Dockerfile -t teams .
docker build -f zoom/Dockerfile -t zoom .
```

The above commands will build the three docker images of the bots.

# Running

To run your docker file, ensure you have created your `.env` file as described in an earlier section.
Ensure that the `.env` file and docker image you are running are configured for the same platform (either `meet | teams | zoom`).

```bash
docker run --env-file .env <PLATFORM>
```

Where `<PLATFORM>` is one of either `meet | teams | zoom`.
