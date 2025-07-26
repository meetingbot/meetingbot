#!/usr/bin/env node

import { BotConfig } from '../types';
import { defineMeetingInfo } from '../utils/meetingParser';
import { spawn } from 'child_process';
import path from 'path';

// Script to run the bot locally with BOT_DATA automatically configured
// Usage: pnpm tsx dev-local.ts <meeting_url> [callback_url]

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: pnpm tsx dev-local.ts <meeting_url> [callback_url]');
  console.error(
    'Example: pnpm tsx dev-local.ts "https://meet.google.com/abc-defg-hij"'
  );
  process.exit(1);
}

const meetingUrl = args[0]!; // Already validated args.length > 0
const callbackUrl = args[1] || 'http://localhost:3000/callback';

// Create bot data
const botData: BotConfig = {
  id: 1,
  userId: 'test',
  meetingInfo: {}, // Will be filled by defineMeetingInfo
  meetingTitle: 'Local Dev Test Meeting',
  startTime: new Date(),
  endTime: new Date(),
  botDisplayName: 'Dev Bot',
  botImage: undefined,
  heartbeatInterval: 10000,
  automaticLeave: {
    waitingRoomTimeout: 30 * 1000, // 30 seconds
    noOneJoinedTimeout: 30 * 1000, // 30 seconds
    everyoneLeftTimeout: 30 * 1000, // 30 seconds
  },
  callbackUrl,
};

// Parse meeting info
const meetingInfo = defineMeetingInfo(decodeURI(meetingUrl));
if (!meetingInfo) {
  console.error('❌ Failed to parse meeting URL. Please check the format.');
  console.error('Supported formats:');
  console.error('  - Google Meet: https://meet.google.com/abc-defg-hij');
  console.error('  - Zoom: https://zoom.us/j/123456789?pwd=password');
  console.error('  - Teams: https://teams.live.com/meet/123456789?p=token');
  process.exit(1);
}

// Create final bot data with meeting info
const finalBotData = {
  ...botData,
  meetingInfo,
};

console.log('✅ Bot data configured successfully');
console.log('Meeting info:', meetingInfo);
console.log('Callback URL:', callbackUrl);

// Set up environment and run npm run dev
const botDataEnv = JSON.stringify(finalBotData);
const env = {
  ...process.env,
  BOT_DATA: botDataEnv,
};

console.log('\n🚀 Starting bot with npm run dev...\n');

// Run npm run dev in the bots directory
const botsDir = path.join(__dirname);
const child = spawn('npm', ['run', 'dev'], {
  cwd: botsDir,
  env,
  stdio: 'inherit',
});

child.on('close', (code) => {
  console.log(`\n🏁 Bot process exited with code ${code}`);
});

child.on('error', (error) => {
  console.error('❌ Failed to start bot:', error);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping bot...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping bot...');
  child.kill('SIGTERM');
});
