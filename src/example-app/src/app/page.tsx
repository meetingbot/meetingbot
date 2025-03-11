'use client';

import { useEffect, useState } from 'react';
import ReactPlayer from "react-player";
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import MeetsBotCreator from './components/MeetsBotCreator';
import RecordingPlayer from './components/RecordingPlayer';
import ZoomBotCreator from './components/ZoomBotCreator';
import { MeetingType } from '~/types/MeetingType';
import MeetingTypeButton from './components/MeetingTypeButton';
import TeamsBotCreator from './components/TeamsBotCreator';

const queryClient = new QueryClient();

export default function Home() {

  const [meetingType, setMeetingType] = useState<MeetingType>('meet');

  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Meeting Chooser</h2>
        <p className="text-muted-foreground">
          Select the meeting platform and input the meeting link to get started.
        </p>

        {/* Body */}
        <div className='p-4'>
          <div className='flex gap-2'>
            <MeetingTypeButton type={'meet'} onPress={setMeetingType} active={meetingType}/>
            <MeetingTypeButton type={'zoom'} onPress={setMeetingType} active={meetingType}/>
            <MeetingTypeButton type={'teams'} onPress={setMeetingType} active={meetingType}/>
          </div>

          {meetingType === 'meet' && <MeetsBotCreator />}
          {meetingType === 'zoom' && <ZoomBotCreator />}
          {meetingType === 'teams' && <TeamsBotCreator />}

        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Recording Replay</h2>
        <p className="text-muted-foreground">
          Once the meeting is finished, the recording will play below.
        </p>
        {/* Body */}
        <div className='p-4'>
          <RecordingPlayer />
        </div>
      </div>

    </QueryClientProvider>
  );
}
