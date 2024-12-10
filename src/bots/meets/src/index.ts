import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { MeetingBot } from "./bot";
import fs, { readFileSync } from "fs";
import dotenv from 'dotenv';
import { setTimeout } from 'timers/promises';
import crypto from 'crypto';
import path from 'path';

dotenv.config()

const main = (async () => {

  // =======================================================
  //                TODO Define via API args
  //
  //
  const url = "https://meet.google.com/mmk-gyqy-ppb";
  const recordingPath = './recording.mp4'
  const botSettings = { name: 'Alex\'s Bot', recordingPath }
  //
  //
  // =======================================================

  if (
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY ||
    !process.env.AWS_BUCKET_NAME ||
    !process.env.AWS_REGION
  ) {
    throw new Error("Missing environment variables");
  }

  // Initialize S3 client
  const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  // Create the bot with settings
  const bot = new MeetingBot(url, botSettings);

  //  Core

  //Join meeting
  let join = 1;
  try{
    join = await bot.joinMeeting();
  } catch (error) {
    if (bot.page) await bot.page.screenshot({path: './tmp/debug.png', fullPage: true});
    throw error
  }

  // Perform meeting actions if successfull
  if (join == 1) {
    await bot.page.screenshot({path: './tmp/debug.png', fullPage: true});
    console.log('The bot could not join the meeting. Saved Screenshot to /tmp/debug.png');
    return 1;
  }

  // Bot Meeting Actions  
  await bot.meetingActions();


  // Browser is now closed.


  // Upload recording to S3
  console.log("Uploading recording to S3...");

  // 1 second delay
  await setTimeout(5000);

  const filePath = path.resolve(__dirname, "recording.mp4");

  const fileContent = await readFileSync(recordingPath);
  const uuid = crypto.randomUUID();
  const key = `recordings/${uuid}-meets-recording.mp4`;

  try {

    const commandObjects = {
      Bucket: process.env.AWS_BUCKET_NAME,
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
})
main();
