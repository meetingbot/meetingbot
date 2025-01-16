import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { MeetingBot } from "./bot";
import fs, { readFileSync } from "fs";
import dotenv from 'dotenv';
import { setTimeout } from 'timers/promises';
import crypto from 'crypto';
import path from 'path';
import { trpc } from './trpc';

// Load In Configs
import config from '../config.json' assert { type: 'json' };
import { url } from "inspector";
console.log(config);
dotenv.config()

const recordingPath = './recording.mp4'

// Create a constant bot with settings (allow for )
let done = false; //when done is true, then we stop pinging the backend.
const bot = new MeetingBot({...config, recordingPath});

const main = (async () => {

  // Generate the Meeting URL

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


  // 15 second delay
  console.log('Wating 15 seconds before unlocking')
  await setTimeout(15000);
  
  // Upload recording to S3
  console.log("Uploading recording to S3...");
  const filePath = path.resolve(__dirname, "recording.mp4");
  const fileContent = readFileSync(recordingPath);
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

  // Stop Heartbeat
  done = true;
})

async function heartbeatLoop() {
  while (!done) {
      console.log('Ping!')
      bot.sendHeartbeat();
      await setTimeout(config.heartbeat_frequency);

      //Test
  }
}

main();

// trpc.bots.heartbeat
//   .mutate({
//     id: parseInt(process.env.BOT_ID || "0"),
//     events: [],
//   })
//   .then((response) => {
//     console.log(
//       `[${new Date().toISOString()}] Heartbeat success: ${response.success}`
//     );
//   });heartbeatLoop();