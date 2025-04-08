import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { recordingUrl } = await req.json();
    
    if (!recordingUrl) {
      return NextResponse.json({ error: 'Recording URL is required' }, { status: 400 });
    }

    // Download the audio file from the URL
    const response = await fetch(recordingUrl);
    const audioBuffer = await response.arrayBuffer();
    const audioBlob = new Blob([audioBuffer]);
    
    // Transcribe with Whisper (not our own model)
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: new File([audioBlob], 'recording.mp4'),
      model: 'whisper-1',
    });
    
    const transcription = transcriptionResponse.text;
    
    // Generate summary with GPT-4o (not our own model)
    const summaryResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that summarizes meeting transcripts.'
        },
        {
          role: 'user',
          content: `Please provide a concise summary of this meeting transcript: ${transcription}`
        }
      ],
    });
    
    const summary = summaryResponse.choices[0]?.message?.content;
    
    return NextResponse.json({ transcription, summary }, { status: 200 });
  } catch (error) {
    console.error('Error in transcription or summarization:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }, { status: 500 });
  }
} 