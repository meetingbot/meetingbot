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

### Using `envBotDataExample.ts`

`envBotDataExample.ts` is a script used to create the `BOT_DATA` environment variable for the bot when testing locally. This is a visually easier way to fill in the values than doing it manually. Create a duplicate of this file to

1. Copy the script into `envBotData.ts` (this will be ignored by git)
2. Fill in the `<...>` with the actual values
3. Ensure the `.env` file is in this directory with _no_ `BOT_DATA` variable
4. Run the script using the following command (this will modify your `.env` file)

```bash
cd src/bots
pnpm tsx envBotData.ts
```

### Environment Setup

See `.env.example` for an understanding of the file structure. Look at `envBotDataExample.ts` for the structure of the variable `BOT_DATA`.

The `meeting_info` object in the `.env` file is used to store the meeting information for the bot to join the meeting. However, this information is platform dependant- Each platform requires the use of different keys in the `meeting_info` object.

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
    "organizerId": "<ORGANIZER_ID>",
    "tenantId": "<TENANT_ID>"
  }
}
```


## Local Testing

The following code is used to run the bots locally in your own environment. Bot code should work as intended on your environment, but we make no guarentees about this. Instead, you should aim to test and develop your code in the docker environment.

```bash
cd src/bots
pnpm install
pnpm run dev
```

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

### Build Issues
If you get an strange erorr while running (eg. Browser not found at file specified), upgrade puppeteer to the latest version in the specific platform's `node_modules` folder.
```bash
cd zoom
pnpm install puppeteer@latest
```