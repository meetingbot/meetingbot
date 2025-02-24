'use client';

import { useState } from 'react';

export default function Home() {
  const [response, setResponse] = useState('');
  const [link, setMeetingLink] = useState('');

  const createBot = async () => {

    if (!/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(link)) {
      setResponse('Invalid Google Meet link format');
      return;
    }

    const botData = {
      userId: 5,
      meetingTitle: 'Test Google Meet',
      meetingInfo: {
        meetingUrl: link,
        platform: 'google',
      },
    };

    try {
      const res = await fetch('/api/bots', {
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
    <div style={{ padding: '20px' }}>
      <h1>Google Meet Bot Creator</h1>
      <input
        type="text"
        value={link}
        onChange={(e) => setMeetingLink(e.target.value)}
        placeholder="Enter meeting link"
        style={{ marginBottom: '10px', padding: '5px', width: '100%' }}
      />
      <button onClick={createBot}>Create Google Meet Bot</button>
      <pre>{response}</pre>
    </div>
  );
}
