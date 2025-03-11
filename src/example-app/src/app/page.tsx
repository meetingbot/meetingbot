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
        <div className='flex gap-2'>
            <MeetingTypeButton type={'meet'} onPress={setMeetingType} active={meetingType}/>
            <MeetingTypeButton type={'zoom'} onPress={setMeetingType} active={meetingType}/>
            <MeetingTypeButton type={'teams'} onPress={setMeetingType} active={meetingType}/>
          </div>

          {meetingType === 'meet' && <MeetsBotCreator />}
          {meetingType === 'zoom' && <ZoomBotCreator />}
          {meetingType === 'teams' && <TeamsBotCreator />}
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
