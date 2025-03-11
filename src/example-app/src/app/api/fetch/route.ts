// app/api/hello/route.ts
import { NextResponse } from 'next/server';

// Handle GET request
export async function GET() {
  return NextResponse.json({ message: 'Hello from the backend!' });
}

// Handle POST request
export async function POST(req: Request) {
  const body = await req.json(); // Read JSON body
  return NextResponse.json({ message: `Hello, ${body.name}!` });
}

