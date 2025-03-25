// app/api/bots/route.ts
import { writeFileSync } from 'fs';
import { NextResponse } from 'next/server';

let recordingLink = '';

export async function GET() {
  console.log('Attempting to get the recording link: ', recordingLink);
  return NextResponse.json({ link: recordingLink }, { status: 200 });
}

export async function POST(req: Request) {
  try {

    console.log('Getting...')
    const body = await req.json();
    const { botId } = body;
    console.log(body)

    // Get Key
    const key = process.env.BOT_API_KEY;
    console.log(key);
    if (!key) throw new Error(`Missing required environment variable: BOT_API_KEY`);
        
    
    // Get a list of currently valid bots
    const endpoint = process.env.MEETINGBOT_END_POINT;
    console.log(endpoint);
    if (!endpoint) throw new Error(`Missing required environment variable: MEETINGBOT_END_POINT`);
    

    // Validate
    console.log(botId);
    if (botId === null) return NextResponse.json('Malfored Body - botId is not defined', { status: 400 });

    //
    // Ensure bot actually exists and is really done
    //
    const response = await fetch(`${endpoint}/api/bots/${botId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
      }  
    });
    console.log(response);

    if (response.status !== 200) {
      // TODO: Uncomment this
      // return NextResponse.json('Bot with id could not be fetched', { status: 404 });

    }

    const fetchedBot = await response.json();
    console.log(fetchedBot);

    //Check if status is done
    if (fetchedBot.status !== 'DONE') {
      console.log('Bot Status is not set to done');
      // TODO: Uncomment this
      // return NextResponse.json('Bot Status not done', { status: 404 });
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
    const bodyBody = await recordingResponse.json();
    console.log(bodyBody);

    const { recordingUrl } = bodyBody;

    // Store Here -- which is then returned using GET
    recordingLink = recordingUrl;
    console.log('Set Recording link to:', recordingLink);
    
    // Passback
    return NextResponse.json({ message: 'OK' }, { status: 200 });

  } catch (error) {
    // return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
