'use client';

import { useEffect, useState } from 'react';
import ReactPlayer from "react-player";
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import MeetsBotCreator from './components/MeetsBotCreator';
import RecordingPlayer from './components/RecordingPlayer';

const queryClient = new QueryClient();

export default function Home() {

  return (
    <QueryClientProvider client={queryClient}>
      <MeetsBotCreator />
      <RecordingPlayer />
    </QueryClientProvider>
  );
}
