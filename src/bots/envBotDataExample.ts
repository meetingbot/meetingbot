/* THIS SCRIPT IS USED TO CREATE THE BOT_DATA ENV VARIABLE FOR THE TEAMS BOT WHEN TESTING LOCALLY */

//HOW TO USE:
// 1. Copy the script into envBotData.ts (this will be ignored by git)
// 2. Fill in the <...> with the actual values
// 3. Ensure the .env file is in this directory with *no* BOT_DATA variable
// 4. Run the script via `pnpm tsx envBotData.ts` (this will modify your .env file)

import { BotConfig } from "./src/types";
import fs from "fs";
import path from "path";

const botData: BotConfig = {
  id: 1,
  userId: "<USER_ID>",
  meetingInfo: {
    meetingId: "<MEETING_ID>",
    meetingPassword: undefined,
    meetingUrl: "<MEETING_URL>",
    organizerId: "<ORGANIZER_ID>",
    tenantId: "<TENANT_ID>",
    messageId: undefined,
    threadId: undefined,
    platform: "teams", // "teams", "google", "zoom", etc.
  },
  meetingTitle: "Test Meeting",
  startTime: new Date(),
  endTime: new Date(),
  botDisplayName: "John Doe",
  botImage: undefined,
  heartbeatInterval: 10000,
  automaticLeave: {
    silenceDetection: { timeout: 3600000, activateAfter: 1200000 },
    botDetection: {
      usingParticipantEvents: { timeout: 600000, activateAfter: 1200000 },
      usingParticipantNames: { timeout: 3600000, activateAfter: 1200000 },
    },
    waitingRoomTimeout: 3600000,
    noOneJoinedTimeout: 3600000,
    everyoneLeftTimeout: 3600000,
  },
  callbackUrl: "<CALLBACK_URL>",
};

// Append the botData object to the .env file as a BOT_DATA json variable
const envFilePath = path.join(__dirname, ".env");
const envFileContent = fs.readFileSync(envFilePath, "utf8");
const updatedEnvFileContent = `${envFileContent}\nBOT_DATA=${JSON.stringify(
  botData
)}`;
fs.writeFileSync(envFilePath, updatedEnvFileContent);

console.log("BOT_DATA variable appended to .env file");
