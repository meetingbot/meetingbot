// app/api/bots/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Get Key
    const key = process.env.BOT_API_KEY;
    if (!key) throw new Error(`Missing required environment variable: BOT_API_KEY`);
    
    const endpoint = process.env.MEETINGBOT_END_POINT;
    if (!endpoint) throw new Error(`Missing required environment variable: BOT_API_KEY`);

    //
    // Send request to MeetingBot API to start and send a bot to a meeting
    //
    const eurl = `${endpoint}/api/bots`;
    console.log('Sending Request to', eurl ,'with body', body);

    //Send
    const response = await fetch(eurl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
      },
      body: JSON.stringify(body),   
    });

    //
    // Return the response from the MeetingBot API
    //

    const data = await response.json();
    console.log('RECEIVED', data);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });

  }
}
