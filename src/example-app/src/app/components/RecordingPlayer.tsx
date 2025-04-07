'use client';

import { useEffect, useState } from 'react';
import ReactPlayer from "react-player";
import TranscriptSummary from './TranscriptSummary';

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
    <div className="space-y-6">
      <div className="w-full max-w-3xl mx-auto">
        {recordingLink ? (
          <>
            <ReactPlayer
              url={recordingLink}
              controls
              width="100%"
              height="auto"
              className="mb-2"
            />
            <div className="text-sm text-muted-foreground mb-6">
              <a href={recordingLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                Open recording in new tab
              </a>
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-muted-foreground border rounded-lg">
            Waiting for recording to become available...
          </div>
        )}
      </div>
      
      <div className="w-full max-w-3xl mx-auto mt-6">
        <TranscriptSummary recordingUrl={recordingLink} />
      </div>
    </div>
  );
}
