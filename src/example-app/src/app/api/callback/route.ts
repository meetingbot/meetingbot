// app/api/bots/route.ts
import { writeFileSync } from 'fs';
import { NextResponse } from 'next/server';

let recordingLink = '';

export async function GET() {
  return NextResponse.json({ recordingLink }, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {botId, status} = body;

    // Get Key
    const key = process.env.BOT_API_KEY;
    if (!key) throw new Error(`Missing required environment variable: BOT_API_KEY`);
        
    // Get a list of currently valid bots
    const endpoint = process.env.MEETINGBOT_END_POINT;
    if (!endpoint) throw new Error(`Missing required environment variable: MEETINGBOT_END_POINT`);

    // Validate
    if (!botId) return NextResponse.json('Malfored Body', { status: 400 });
    if (!status) return NextResponse.json('Malfored Body', { status: 400 });

    //
    // Ensure bot actually exists and is really done
    //
    const response = await fetch(`${endpoint}/api/bots`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
      }  
    });
    const activeBotData = await response.json();

    // Check if bot exists in here
    const botExists = activeBotData.some((bot: { id: string }) => bot.id === botId);
    if (!botExists) {
      return NextResponse.json('Bot not found', { status: 404 });
    }
    //Check if status is done
    const botStatus = activeBotData.find((bot: { id: string }) => bot.id === botId).status;
    if (botStatus !== status) {
      return NextResponse.json('Bot not done', { status: 404 });
    }

    //
    // Send request to MeetingBot API to download the recording
    //
    const recordingResponse = await fetch(`${endpoint}/api/bots/${botId}/recording`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
      }  
    });
    const { recording: recordingUrl } = await response.json();

    // Store Here to return using GET
    recordingLink = recordingUrl;

    // Passback
    return NextResponse.json({ message: 'OK' }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
