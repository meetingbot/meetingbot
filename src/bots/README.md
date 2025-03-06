## File Structure

```
src/bots/
├─ package.json _global dependencies_
├─ pnpm-workspace.yaml _specifies sub-workspaces_
├─ tsconfig.json _global ts configurations_
├─ src/
│ ├─ index.ts _main script_
| ├─ bot.ts _bot class definition_
| ├─ monitoring.ts _monitoring methods used by main script_
| ├─ trpc.ts _trpc client_
├─ team|zoom|meet/
│ ├─ Dockerfile _bot-specific docker file_
│ ├─ package.json _bot-specific dependencies_
│ ├─ pnpm-lock.yaml
| ├─ tsconfig.json _bot-specific ts configurations_
│ ├─ src/
│ │ ├─ bot.ts _platform-specific bot class_
```

## Environment

Please refer to the `.env.example` file for the environment variables.

`envBotDataExample.ts` is a script used to create the `BOT_DATA` environment variable for the bot when testing locally.

_Why use `envBotDataExample.ts`?_

- visually easier to fill in the values
- type saftey when filling in the values

### How to use `envBotDataExample.ts`

1. Copy the script into `envBotData.ts` (this will be ignored by git)
2. Fill in the `<...>` with the actual values
3. Ensure the `.env` file is in this directory with _no_ `BOT_DATA` variable
4. Run the script via `pnpm tsx envBotData.ts` (this will modify your `.env` file)



## Required Meeting Info per platform

The `meeting_info` object in the `.env` file is used to store the meeting information for the bot to join the meeting. However, this information is platform dependant -
Each platform requires the use of different keys in the `meeting_info` object.

###Zoom
```json
{
  "meeting_info": {
    "platform": "zoom",
    "meetingId": "<MEETING_ID>",
    "meetingPassword": "<MEETING_PASSWORD>"
  }
}
```

###Google Meet
```json
{
  "meeting_info": {
    "platform": "google",
    "meetingUrl": "<MEETING_LINK>"
  }
}
```
Where Meeting Link is the full URL to the meeting.

###Microsoft Teams
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

## Local Development

```bash
cd src/bots
pnpm install
pnpm run dev
```

## Building

```bash
cd src/bots
docker build -f meet/Dockerfile -t meet .
docker build -f teams/Dockerfile -t teams .
docker build -f zoom/Dockerfile -t zoom .
```

## Running

```bash
docker run --env-file .env meet
docker run --env-file .env teams
docker run --env-file .env zoom
```
