// app/api/bots/route.ts

import { NextResponse } from 'next/server';

let recordingLink = '';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let clients: any[] = []; // Store connected clients

// Get Key
const BOT_API_KEY = process.env.BOT_API_KEY;
const MEETINGBOT_END_POINT = process.env.MEETINGBOT_END_POINT;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const isSSE = searchParams.get('sse') === 'true';

  // Construct the webhook
  if (isSSE) {
    const stream = new ReadableStream({
      start(controller) {
        const client = {
          send: (data: string) => controller.enqueue(`data: ${data}\n\n`),
          close: () => controller.close(),
        };
        clients.push(client);

        // Remove client on disconnect
        req.signal.addEventListener('abort', () => {
          clients = clients.filter((c) => c !== client);
        });
      },
    });

    //Pass the Response back
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }

  // Fallback for non-SSE requests
  return NextResponse.json({ link: recordingLink }, { status: 200 });
}

// Validate Bot is finished and exists
const validateBot = async (botId: number) => {

  // Validate
  if (!BOT_API_KEY) return NextResponse.json({ error: 'Missing required environment variable: BOT_API_KEY' }, { status: 500 });
  if (!MEETINGBOT_END_POINT) return NextResponse.json({ error: 'Missing required environment variable: MEETINGBOT_END_POINT' }, { status: 500 });

  // Ensure bot actually exists and is really done
  const response = await fetch(`${MEETINGBOT_END_POINT}/api/bots/${botId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': BOT_API_KEY,
    }
  });

  // Bot Validation Failed
  if (response.status !== 200) return false;

  //Check if status is done
  const fetchedBot = await response.json();
  if (fetchedBot.status !== 'DONE') return false;

  // Bot Validation Passed
  return true;
}


export async function POST(req: Request) {
  try {

    // Validate
    if (!BOT_API_KEY) return NextResponse.json({ error: 'Missing required environment variable: BOT_API_KEY' }, { status: 500 });
    if (!MEETINGBOT_END_POINT) return NextResponse.json({ error: 'Missing required environment variable: MEETINGBOT_END_POINT' }, { status: 500 });

    // Get bot id from request body telling it it's done
    const { botId } = await req.json();
    if (botId === null)
      return NextResponse.json('Malfored Body - botId is not defined', { status: 400 });

    // Ideally - your app would be hosted on AWS along with the bot service, or 
    // you would have a secure way of communicating with the bot service.
    // As this is an example app, we will just allow any request to come through.

    // We will just validate that the bot is finished.
    const validationResult = validateBot(botId);
    if (!validationResult)
      return NextResponse.json('Bot Validation Failed', { status: 403 });

    //
    // Send request to MeetingBot API to get the signed Recording URL from S3
    const recordingResponse = await fetch(`${MEETINGBOT_END_POINT}/api/bots/${botId}/recording`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': BOT_API_KEY,
      }
    });

    //Get The Bot Recording URL
    const { recordingUrl } = await recordingResponse.json();

    //Save
    recordingLink = recordingUrl;
    console.log('Set Recording link to:', recordingLink);

    // Notify all connected clients
    clients.forEach((client) => client.send(JSON.stringify({ recordingLink })));

    // Passback
    return NextResponse.json({ message: 'OK' }, { status: 200 });

  } catch (error) {
    console.error('Error in POST:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
