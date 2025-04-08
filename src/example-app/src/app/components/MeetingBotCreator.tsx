'use client';
import { useState } from 'react';
import { Button } from './button';
import { MeetingType } from '~/types/MeetingType';

//Meeting Check Functions
const checkMeetBotLink = (link: string) => {
  return /^((https:\/\/)?meet\.google\.com\/)?[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(link);
}

const checkZoomBotLink = (link: string) => {
  // Match any zoom.us subdomain followed by /j/ and 9-11 digits
  return /^https:\/\/[a-z0-9]+\.zoom\.us\/j\/[0-9]{9,11}(?:\?pwd=[^&]+)?$/.test(link);
}

function parseTeamsMeetingLink(url: string) {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');

    // Extract meetingId (after "19:meeting_")
    let meetingId = null;
    const meetingSegment = pathSegments.find(segment => segment.startsWith('19%3ameeting_'));
    if (meetingSegment) {
      const s = meetingSegment.split('19%3ameeting_')[1];
      if (!s) return null;
      meetingId = meetingSegment ? decodeURIComponent(s).split('@')[0] : null;
    }

    // Extract tenantId and organizationId from context parameter
    const params = new URLSearchParams(urlObj.search);
    const context = params.get("context");

    let tenantId = null;
    let organizationId = null;
    if (context) {
      const contextObj = JSON.parse(decodeURIComponent(context));
      tenantId = contextObj.Tid || null;
      organizationId = contextObj.Oid || null;
    }

    if (meetingId === null || tenantId === null || organizationId === null) {
      return null;
    }

    return { meetingId, tenantId, organizationId };
  } catch (error) {
    console.error("Error parsing Teams meeting link:", error);
    return null;
  }
}

const checkTeamsBotLink = (link: string) => {
  return parseTeamsMeetingLink(link) !== null;
}

const linkParsers: Record<MeetingType, (link: string) => boolean> = {
  'meet': checkMeetBotLink,
  'zoom': checkZoomBotLink,
  'teams': checkTeamsBotLink,
}

function parseZoomMeetingLink(url: string) {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');
    const meetingId = pathSegments[pathSegments.length - 1];
    const meetingPassword = urlObj.searchParams.get('pwd') || '';

    return {
      meetingId,
      meetingPassword
    };
  } catch (error) {
    console.error("Error parsing Zoom meeting link:", error);
    return null;
  }
}

export default function MeetingBotCreator() {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [response, setResponse] = useState<any>({});
  const [link, setMeetingLink] = useState('');
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const [showFullResponse, setShowFullResponse] = useState(false);

  const defineMeetingInfo = (link: string, type: MeetingType|undefined) => {

    if (type === 'meet') {

      // Ensure we get a meeting URL
      if (!link.startsWith('https://meet.google.com/')) link = 'https://meet.google.com/' + link;
      if (!link.startsWith('https://')) link = 'https://' + link;
      
      return {
        meetingUrl: link,
        platform: 'google',
      };
    }
    // Zoom
    if (type === 'zoom') {
      const parsed = parseZoomMeetingLink(link);
      if (!parsed) return undefined;

      return {
        platform: 'zoom',
        meetingId: parsed.meetingId,
        meetingPassword: parsed.meetingPassword
      };
    }
    // Teams
    if (type === 'teams') {

      // Fetch
      const parsed = parseTeamsMeetingLink(link);
      if (!parsed) return undefined;

      const { meetingId, organizationId, tenantId } = parsed;

      return {
        platform: "teams",
        meetingId,
        organizerId: organizationId,
        tenantId
      }
    }

    return undefined;
  }

  //
  // Create a bot
  //
  const createBot = async () => {

    // Find the type again
    const inputType = parseMeetingLink();
    if (inputType === undefined) {
      setResponse('Invalid Meeting Link. Must be of form meet/teams/zoom');
    }

    // Define Here
    const ruuid = "50e8400-e29b-41d4-a716-446655440000"
    const callbackUrl = process.env.NEXT_PUBLIC_CALLBACK_URL || 'https://localhost:3002/api/callback';

    const meetingInfo = defineMeetingInfo(link, inputType);
    if (!meetingInfo) {
      setResponse('Could not generate meeting info body. Bad URL.')
    }

    // Create Bot Data
    const botData = {
      userId: ruuid,
      meetingTitle: `Test ${inputType && (inputType[0]?.toUpperCase() + inputType?.slice(1) + ' ')}Bot`,
      meetingInfo,
      callbackUrl,
    };

    setWaitingForResponse(true);
    try {
      const res = await fetch('/api/send-bot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(botData),
      });

      const data = await res.json();
      setResponse(data);
      setWaitingForResponse(false);

    } catch (error) {
      setResponse(`Failed to create bot: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setWaitingForResponse(false);
    }
  };

  // Check Valid Meeting Link
  const parseMeetingLink = () => {

    // None -- Link
    if (!link) return undefined;

    // Check for Bot Type
    for (const [key, checkFunction] of Object.entries(linkParsers)) {
      if (checkFunction(link)) {
        return key as MeetingType;
      }
    }

    return undefined;
  }

  const detectedBot: MeetingType | undefined = parseMeetingLink();
  const platformString = detectedBot ? detectedBot[0]?.toUpperCase() + detectedBot.slice(1) : undefined;

  const inputFieldClass = 'my-[20px] p-2 w-full rounded-md border border-input bg-background shadow-sm hover:bg-accent mt-0' +
    (detectedBot ? ' font-medium text-accent-foreground hover:text-accent-foreground' : ' text-muted-foreground hover:text-muted-foreground');

  const shortResponse = /"id": \d+/.test(response) ? 'Bot was created.' : 'Bot was not created.';

  return (
    <div style={{ width: '50%', minWidth: '300px', padding: '20px' }}>
      <input
        type="text"
        value={link}
        onChange={(e) => setMeetingLink(e.target.value)}
        placeholder="https:/meet.google.com/abc-defg-hij"
        className={inputFieldClass}
      />

      {waitingForResponse
      ?
        <Button variant={'disabled'}>Sending Request...</Button>
      :
        (
          detectedBot
            ?
            <Button variant={'outline'} onClick={createBot}>Create {platformString} Bot</Button>
            :
            <Button variant={'disabled'}>Unknown Meeting Link</Button>
        )
      }

      {
        response &&
        <div className='mt-4'>
          <h2 className="text-large font-bold tracking-tight">
            Response
          </h2>
            {showFullResponse
              ?
              <div>
                <pre className="pl-4 text-xs opacity-70 max-h-[200px] overflow-y-auto">{JSON.stringify(response, null, 2)}</pre>
                <Button variant={'ghost'} onClick={() => setShowFullResponse(false)}>Hide Full Response</Button>
              </div>
              :
              <div>
                <p className="text-muted-foreground mb-2">{shortResponse}</p>

                <Button variant={'outline'} onClick={() => setShowFullResponse(true)}>Show Full Response</Button>
              </div>
            }
          </div>
    }
    </div>
  );
}
