'use client';

import { useEffect, useState } from 'react';
import ReactPlayer from "react-player";
import { useQuery } from 'react-query';

export default function RecordingPlayer() {
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

  return (
    <div style={{ width: '50%', minWidth:'300px', padding: '20px' }}>
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
