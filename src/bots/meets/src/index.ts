import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { MeetingBot } from "./bot";
import fs, { readFileSync } from "fs";
import dotenv from 'dotenv';
import { setTimeout } from 'timers/promises';
import crypto from 'crypto';
import path from 'path';
import { startHeartbeat, reportEvent } from './monitoring';

// Load In Configs
dotenv.config()

const main = (async () => {
  // Get configuration from environment variables
  const requiredEnvVars = [
    'BOT_DATA',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_BUCKET_NAME',
    'AWS_REGION'
  ] as const

  // Check all required environment variables are present
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`)
    }
  }

  // Parse bot data
  const botData = JSON.parse(process.env.BOT_DATA!)
  console.log('Received bot data:', botData)
  const botId = botData.botId
  const url = botData.meetingUrl
  const recordingPath = botData.recordingPath
  const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID!
  const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!
  const awsBucketName = process.env.AWS_BUCKET_NAME!
  const awsRegion = process.env.AWS_REGION!

  // Initialize S3 client
  const s3Client = new S3Client({
    region: awsRegion,
    credentials: {
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
    },
  });

  // Create AbortController for heartbeat
  const heartbeatController = new AbortController();

  // Start heartbeat in the background
  startHeartbeat(botId, heartbeatController.signal);

  // Create the bot with settings
  const botSettings = {
    name: botData.name,
    recordingPath,
    // Automatic leave settings from bot data
    silenceTimeout: botData.automaticLeave.silenceDetection.timeout,
    silenceActivateAfter: botData.automaticLeave.silenceDetection.activateAfter,
    botDetectionTimeout: botData.automaticLeave.botDetection.usingParticipantEvents.timeout,
    botDetectionActivateAfter: botData.automaticLeave.botDetection.usingParticipantEvents.activateAfter,
    waitingRoomTimeout: botData.automaticLeave.waitingRoomTimeout,
    noOneJoinedTimeout: botData.automaticLeave.noOneJoinedTimeout,
    everyoneLeftTimeout: botData.automaticLeave.everyoneLeftTimeout,
  }

  const bot = new MeetingBot(url, botSettings, async (eventType, data) => {
    await reportEvent(botId, eventType, data);
  });

  // Report READY_TO_DEPLOY event
  await reportEvent(botId, 'READY_TO_DEPLOY');

  //Join meeting
  let join = 1;
  try{
    await reportEvent(botId, 'JOINING_CALL');
    join = await bot.joinMeeting();
  } catch (error) {
    if (bot.page) await bot.page.screenshot({path: './tmp/debug.png', fullPage: true});
    await reportEvent(botId, 'FATAL', { description: error.message });
    throw error
  }

  // Perform meeting actions if successful
  if (join == 1) {
    await bot.page.screenshot({path: './tmp/debug.png', fullPage: true});
    console.log('The bot could not join the meeting. Saved Screenshot to /tmp/debug.png');
    await reportEvent(botId, 'FATAL', { description: 'Could not join meeting' });
    return 1;
  }

  await reportEvent(botId, 'IN_CALL');

  // Bot Meeting Actions  
  await bot.meetingActions();

  await reportEvent(botId, 'CALL_ENDED', { description: 'Meeting actions completed' });

  // Browser is now closed.

  // Upload recording to S3
  console.log("Uploading recording to S3...");
  const filePath = path.resolve(__dirname, "recording.mp4");
  const fileContent = readFileSync(recordingPath);
  const uuid = crypto.randomUUID();
  const key = `recordings/${uuid}-meets-recording.mp4`;

  try {
    const commandObjects = {
      Bucket: awsBucketName,
      Key: key,
      Body: fileContent,
      ContentType: 'video/mp4',
    };

    const putCommand = new PutObjectCommand(commandObjects);
    await s3Client.send(putCommand);
    console.log(`Successfully uploaded recording to S3: ${key}`);

    // Clean up local file
    await fs.promises.unlink(recordingPath);
  } catch (error) {
    console.error("Error uploading to S3:", error);
  }

  // After S3 upload and cleanup, stop the heartbeat
  heartbeatController.abort();
  console.log("Bot execution completed, heartbeat stopped.");

  // Report final DONE event
  await reportEvent(botId, 'DONE');
})
main();