// app/api/bots/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Get Key
    const key = process.env.BOT_API_KEY;
    if (!key) throw new Error(`Missing required environment variable: BOT_API_KEY`);
        
    // Get a list of currently valid bots
    const endpoint = process.env.MEETINGBOT_END_POINT;
    if (!endpoint) throw new Error(`Missing required environment variable: MEETINGBOT_END_POINT`);

    // Validate
    if (!body.botId) return NextResponse.json('Malfored Body', { status: 400 });
    if (!body.status) return NextResponse.json('Malfored Body', { status: 400 });

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


    // Send request to MeetingBot API to download the recording


    // Download the Recording locally here
    



    // // Get Key
    // const key = process.env.BOT_API_KEY;
    // if (!key) throw new Error(`Missing required environment variable: BOT_API_KEY`);
    
    // const endpoint = process.env.MEETINGBOT_END_POINT;
    // if (!endpoint) throw new Error(`Missing required environment variable: BOT_API_KEY`);

    // //
    // // Send request to MeetingBot API to start and send a bot to a meeting
    // //
    // const response = await fetch(`${endpoint}/api/bots`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'x-api-key': key,
    //   },
    //   body: JSON.stringify(body),   
    // });

    // //
    // // Return the response from the MeetingBot API
    // //

    // const data = await response.json();
    // console.log('RECEIVED', data);
    return NextResponse.json([], { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 });
  }
}
