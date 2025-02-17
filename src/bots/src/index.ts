import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { MeetsBot } from "meet/src/bot";
import { TeamsBot } from "teams/src/bot";
import { ZoomBot } from "zoom/src/bot";
import { Bot } from "./bot";
import fs, { readFileSync } from "fs";
import dotenv from "dotenv";
import { setTimeout } from "timers/promises";
import crypto from "crypto";
import { startHeartbeat, reportEvent } from "./monitoring";
import { EventCode, type BotConfig } from "./types";

dotenv.config();

const main = async () => {
  const requiredEnvVars = [
    "BOT_DATA",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_BUCKET_NAME",
    "AWS_REGION",
  ] as const;

  // Check all required environment variables are present
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  // Parse bot data
  const botData: BotConfig = JSON.parse(process.env.BOT_DATA!);
  console.log("Received bot data:", botData);
  const botId = botData.id;

  // Initialize S3 client
  const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  // Create the appropriate bot instance based on platform
  let bot: Bot;
  switch (botData.meetingInfo.platform) {
    case "google":
      bot = new MeetsBot(botData, async (eventType: EventCode, data: any) => {
        await reportEvent(botId, eventType, data);
      });
      break;
    case "teams":
      bot = new TeamsBot(botData, async (eventType: EventCode, data: any) => {
        await reportEvent(botId, eventType, data);
      });
      break;
    case "zoom":
      bot = new ZoomBot(botData, async (eventType: EventCode, data: any) => {
        await reportEvent(botId, eventType, data);
      });
      break;
    default:
      throw new Error(`Unsupported platform: ${botData.meetingInfo.platform}`);
  }

  // Create AbortController for heartbeat
  const heartbeatController = new AbortController();

  // Start heartbeat in the background
  console.log("Starting heartbeat");
  startHeartbeat(botId, heartbeatController.signal);

  // Report READY_TO_DEPLOY event
  await reportEvent(botId, EventCode.READY_TO_DEPLOY);

  try {
    // Run the bot
    await bot.run();

    // 1 second delay
    console.log(
      "Waiting 1 second before proceeding (ensure recording is unlocked)"
    );
    await setTimeout(1000);

    // Upload recording to S3
    console.log("Uploading recording to S3...");
    const recordingPath = bot.getRecordingPath();
    const fileContent = readFileSync(recordingPath);
    const uuid = crypto.randomUUID();
    const contentType = bot.getContentType();
    const key = `recordings/${uuid}-${
      bot.settings.meetingInfo.platform
    }-recording.${contentType.split("/")[1]}`;

    try {
      const commandObjects = {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
        Body: fileContent,
        ContentType: contentType,
      };

      const putCommand = new PutObjectCommand(commandObjects);
      await s3Client.send(putCommand);
      console.log(`Successfully uploaded recording to S3: ${key}`);

      // Clean up local file
      await fs.promises.unlink(recordingPath);
    } catch (error) {
      console.error("Error uploading to S3:", error);
    }
  } catch (error) {
    console.error("Error running bot:", error);
    await reportEvent(botId, EventCode.FATAL, {
      description: (error as Error).message,
    });
  }

  // After S3 upload and cleanup, stop the heartbeat
  heartbeatController.abort();
  console.log("Bot execution completed, heartbeat stopped.");

  // Report final DONE event
  await reportEvent(botId, EventCode.DONE);
};
main();
