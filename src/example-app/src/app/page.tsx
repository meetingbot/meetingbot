'use client';

import { useEffect, useState } from 'react';
import ReactPlayer from "react-player";
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import MeetingBotCreator from './components/MeetingBotCreator';
import RecordingPlayer from './components/RecordingPlayer';
import { MeetingType } from '~/types/MeetingType';
import MeetingTypeButton from './components/MeetingTypeButton';
import AppSection from './components/AppSection';
import Image from "next/image";
import { Button } from './components/button';

const queryClient = new QueryClient();

export default function Home() {

  const [meetingType, setMeetingType] = useState<MeetingType>('meet');

  return (
    <QueryClientProvider client={queryClient}>

      {/* Simple Header */}
      <div className='flex items-center p-4 gap-4'>
        <Image
            src="/logo.svg"
            alt="Logo"
            width={48}
            height={48}
            className="mr-2"
          />
        <h1 className="text-3xl font-bold text-center">Meeting Bot</h1>
        <h1 className="text-2xl text-muted-foreground" style={{translate: '0px 2px'}}>Example Application</h1>
        <div className='ml-auto'>
          <Button variant="outline" size="sm" onClick={() => window.open('https://github.com/meetingbot/meetingbot')}>GitHub</Button>
        </div>
      </div>

      <div className='p-8'>
        <AppSection 
          header={'Enter Meeting Link'} 
          description={'Enter a meeting link for a Meet, Teams or Zoom Meeting.'}
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
      </div>

    </QueryClientProvider>
  );
}
