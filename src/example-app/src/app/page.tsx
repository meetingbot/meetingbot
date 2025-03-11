'use client';

import { useEffect, useState } from 'react';
import ReactPlayer from "react-player";
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import MeetingBotCreator from './components/MeetingBotCreator';
import RecordingPlayer from './components/RecordingPlayer';
import { MeetingType } from '~/types/MeetingType';
import MeetingTypeButton from './components/MeetingTypeButton';
import AppSection from './components/AppSection';

const queryClient = new QueryClient();

export default function Home() {

  const [meetingType, setMeetingType] = useState<MeetingType>('meet');

  return (
    <QueryClientProvider client={queryClient}>

      <AppSection 
        header={'Meeting Chooser'} 
        description={'Select the meeting platform and input the meeting link to get started.'}
      >
        <MeetingBotCreator />
      </AppSection>

      {/* Recording */}
      <AppSection 
        header={'Recording Replay'} 
        description={'Once the meeting is finished, the recording will play below.'}
      >
        <RecordingPlayer />
      </AppSection>

    </QueryClientProvider>
  );
}
