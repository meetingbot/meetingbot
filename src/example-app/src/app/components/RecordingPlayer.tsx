'use client';

import { useEffect, useState } from 'react';
import ReactPlayer from "react-player";
import { useQuery } from 'react-query';

export default function RecordingPlayer() {
  
  const [recordingLink, setRecordingLink] = useState<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource('/api/callback?sse=true');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setRecordingLink(data.recordingLink);
    };

    eventSource.onerror = () => {
      console.error('Error with SSE connection');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div style={{ width: '50%', minWidth: '300px', padding: '20px' }}>
      {
        recordingLink
          ?
          (<>
            <ReactPlayer
              url={recordingLink}
              controls
            />
            <h3><a href={recordingLink}>Follow</a></h3>
          </>)
          :
          (<h1>Waiting for recording to become available ... </h1>)
      }
    </div>
  );
}
