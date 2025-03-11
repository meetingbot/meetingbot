'use client';

import { useEffect, useState } from 'react';
import ReactPlayer from "react-player";
import { useQuery } from 'react-query';

export default function ZoomBotCreator() {
  const [response, setResponse] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [meetingPassword, setMeetingPassword] = useState('');

  const createBot = async () => {

    // if (!/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(link)) {
    //   setResponse('Invalid Google Meet link format');
    //   return;
    // }

    const ruuid = "50e8400-e29b-41d4-a716-446655440000"
    const callbackUrl = process.env.CALLBACK_URL || 'https://localhost:3002/api/callback';

    const botData = {
      userId: ruuid,
      meetingTitle: 'Test Zoom Meeting',
      meetingInfo: {
        platform: 'zoom',
        meetingId: meetingId,
        meetingPassword: meetingPassword
      },
      callbackUrl,
    };

    try {
      const res = await fetch('/api/send-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(botData),
      });

      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setResponse('Failed to create bot');
    }
  };

  return (
    <div style={{ width: '50%', minWidth:'300px', padding: '20px' }}>
      <h1>Zoom Bot Creator</h1>

      <h3>Meeting Id</h3>
      <input
        type="text"
        value={meetingId}
        onChange={(e) => setMeetingId(e.target.value)}
        placeholder="1234567890"
        style={{ marginBottom: '10px', padding: '5px', width: '100%' }}
      />

    <h3>Meeting Password</h3>
      <input
        type="text"
        value={meetingPassword}
        onChange={(e) => setMeetingPassword(e.target.value)}
        placeholder="password123"
        style={{ marginBottom: '10px', padding: '5px', width: '100%' }}
      />

      <button className='border border-white p-2 rounded-lg mb-5' onClick={createBot}>Create Zoom Bot</button>
      
      <h2>Response</h2>
      <pre className="text-xs opacity-70 max-h-[200px] overflow-y-auto">{response}</pre>
    </div>
  );
}
