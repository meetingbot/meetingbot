export type MeetingType = 'meet' | 'zoom' | 'teams';

// Meeting Check Functions
export const checkMeetBotLink = (link: string) => {
  return /^((https:\/\/)?meet\.google\.com\/)?[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(
    link
  );
};

export const checkZoomBotLink = (link: string) => {
  // Match any zoom.us subdomain followed by /j/ and 9-11 digits
  return /^https:\/\/[a-z0-9]+\.zoom\.us\/j\/[0-9]{9,11}(?:\?pwd=[^&]+)?$/.test(
    link
  );
};

export const checkTeamsBotLink = (link: string) => {
  // Match teams.live.com URLs with meeting ID and optional password
  return /^https:\/\/teams\.live\.com\/meet\/[0-9]{9,}(?:\?p=\w+)?$/.test(link);
};

export const linkParsers: Record<MeetingType, (link: string) => boolean> = {
  meet: checkMeetBotLink,
  zoom: checkZoomBotLink,
  teams: checkTeamsBotLink,
};

export function parseZoomMeetingLink(url: string) {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');
    const meetingId = pathSegments[pathSegments.length - 1];
    const meetingPassword = urlObj.searchParams.get('pwd') || '';

    return {
      meetingId,
      meetingPassword,
    };
  } catch (error) {
    console.error('Error parsing Zoom meeting link:', error);
    return null;
  }
}

export function parseTeamsMeetingLink(url: string) {
  try {
    // Match teams.live.com URLs and capture meeting ID and password
    const match = url.match(
      /^https:\/\/teams\.live\.com\/meet\/([0-9]{9,})(?:\?p=(\w+))?$/
    );

    if (!match) return null;

    const meetingId = match[1]; // First capture group
    const password = match[2] || ''; // Second capture group (optional)

    return {
      meetingId,
      meetingPassword: password,
    };
  } catch (error) {
    console.error('Error parsing Teams meeting link:', error);
    return null;
  }
}

export const defineMeetingInfo = (link: string) => {
  console.log('Parsing meeting link:', link);

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
  };

  const type = parseMeetingLink();
  console.log('Detected meeting type:', type);

  if (type === 'meet') {
    // Ensure we get a meeting URL
    let processedLink = link;
    if (!processedLink.startsWith('https://meet.google.com/'))
      processedLink = 'https://meet.google.com/' + processedLink;
    if (!processedLink.startsWith('https://'))
      processedLink = 'https://' + processedLink;

    return {
      meetingUrl: processedLink,
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
      meetingPassword: parsed.meetingPassword,
    };
  }
  // Teams
  if (type === 'teams') {
    // Fetch
    const parsed = parseTeamsMeetingLink(link);
    if (!parsed) return undefined;

    const { meetingId, meetingPassword } = parsed;

    return {
      platform: 'teams',
      meetingId,
      meetingPassword,
    };
  }

  return undefined;
};
