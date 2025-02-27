'use client';

import { useEffect, useState } from 'react';
import ReactPlayer from "react-player";

export default function Home() {
  const [response, setResponse] = useState('');
  const [link, setMeetingLink] = useState('');

  const [videoLink, setVideoLink] = useState('');

  // Query this app's backend to get the most recent recording
  const { data, refetch } = useQuery({
      queryKey: ["apiStatus"],
      queryFn: async () => {
          const res = await fetch("/api/callback");
          return res.json();
      },
      refetchInterval: 5000, // Auto-refetch every 5 seconds
  });

  // Set Data
  useEffect(() => {
    if (data && data.link) {
      setVideoLink(data.link);
    }
  }, [data]);

  // Start the Refetch
  useEffect(() => {
    refetch();
  }, []);

  const createBot = async () => {

    if (!/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(link)) {
      setResponse('Invalid Google Meet link format');
      return;
    }

    const ruuid = "50e8400-e29b-41d4-a716-446655440000"
    const callbackUrl = process.env.CALLBACK_URL || 'https://localhost:3002/api/callback';

    const botData = {
      userId: ruuid,
      meetingTitle: 'Test Google Meet',
      meetingInfo: {
        meetingUrl: link,
        platform: 'google',
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
      <h1>Google Meet Bot Creator</h1>
      <input
        type="text"
        value={link}
        onChange={(e) => setMeetingLink(e.target.value)}
        placeholder="Enter meeting link"
        style={{ marginBottom: '10px', padding: '5px', width: '100%' }}
      />
      <button className='border border-white p-2 rounded-lg mb-5' onClick={createBot}>Create Google Meet Bot</button>
      
      <h2>Response</h2>
      <pre className="text-xs opacity-70 max-h-[200px] overflow-y-auto">{response}</pre>

      {
        videoLink
        ?
        (<ReactPlayer
          url={videoLink}
          controls
          width="640px"
          height="360px"
        />)
        :
        (<h1>Recording not available</h1>)
      }
    </div>
  );
}
function useQuery(arg0: { queryKey: string[]; queryFn: () => Promise<any>; refetchInterval: number; }): { data: any; refetch: any; } {
  throw new Error('Function not implemented.');
}

