import { BotConfig } from '../types';
import { defineMeetingInfo } from '../utils/meetingParser';
// @ts-ignore
import fs from 'fs';
// @ts-ignore
import path from 'path';

/* THIS SCRIPT IS USED TO CREATE THE BOT_DATA ENV VARIABLE FOR THE BOT WHEN TESTING LOCALLY */

// Script to set BOT_DATA in .env file from a meeting URL
// Usage: pnpm set-bot-data <meeting_url> [callback_url]

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: pnpm set-bot-data <meeting_url> [callback_url]');
  console.error(
    'Example: pnpm set-bot-data "https://meet.google.com/abc-defg-hij"'
  );
  process.exit(1);
}

const meetingUrl = args[0]!; // Already validated args.length > 0
const callbackUrl = args[1] || 'http://localhost:3000/callback';

const botData: BotConfig = {
  id: 1,
  userId: 'test',
  meetingInfo: {}, // empty, because we fill it in as expected by parsing the URL (this makes it easy for teams & zoom, which request a specific format)
  meetingTitle: 'Test Meeting',
  startTime: new Date(),
  endTime: new Date(),
  botDisplayName: 'John Doe',
  botImage: undefined,
  heartbeatInterval: 10000,
  automaticLeave: {
    waitingRoomTimeout: 30 * 1000, // 30 seconds
    noOneJoinedTimeout: 30 * 1000, // 30 seconds
    everyoneLeftTimeout: 30 * 1000, // 30 seconds
  },
  callbackUrl,
};

// Append the botData object to the .env file as a BOT_DATA json variable

//@ts-ignore
const envFilePath = path.join(__dirname, '..', '..', '.env');
let envFileContent = fs.readFileSync(envFilePath, 'utf8');

// Delete the existing BOT_DATA line
envFileContent = envFileContent.replace(/BOT_DATA=.*\n?/, '');

// Parse meeting info
const meetingInfo = defineMeetingInfo(meetingUrl);
if (!meetingInfo) {
  console.error('❌ Failed to parse meeting URL. Please check the format.');
  console.error('Supported formats:');
  console.error('  - Google Meet: https://meet.google.com/abc-defg-hij');
  console.error('  - Zoom: https://zoom.us/j/123456789?pwd=password');
  console.error('  - Teams: https://teams.live.com/meet/123456789?p=token');
  process.exit(1);
}

const updatedEnvFileContent = `${envFileContent}\nBOT_DATA=${JSON.stringify({
  ...botData,
  meetingInfo,
})}`;

fs.writeFileSync(envFilePath, updatedEnvFileContent);

console.log('✅ BOT_DATA variable updated in .env file');
console.log('Meeting info:', meetingInfo);
console.log('Callback URL:', callbackUrl);
