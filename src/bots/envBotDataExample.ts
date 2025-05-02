import { BotConfig } from "./src/types";
// @ts-ignore
import fs from "fs";
// @ts-ignore
import path from "path";

/* THIS SCRIPT IS USED TO CREATE THE BOT_DATA ENV VARIABLE FOR THE TEAMS BOT WHEN TESTING LOCALLY */

//HOW TO USE:
// 1. Copy the script into envBotData.ts (this will be ignored by git)
// 2. Fill in the <...> with the actual values
// 3. Ensure the .env file is in this directory with *no* BOT_DATA variable
// 4. Run the script via `pnpm tsx envBotData.ts` (this will modify your .env file)

// Paste in your meeting URL here
const url = '<MEETING_URL>';

const botData: BotConfig = {
  id: 1,
  userId: "<USER_ID>",
  meetingInfo: {}, // empty, because we fill it in as expected by parsing the URL (this makes it easy for teams & zoom, which request a specific format)
  meetingTitle: "Test Meeting",
  startTime: new Date(),
  endTime: new Date(),
  botDisplayName: "John Doe",
  botImage: undefined,
  heartbeatInterval: 10000,
  automaticLeave: {
    waitingRoomTimeout: 3600000,
    noOneJoinedTimeout: 3600000,
    everyoneLeftTimeout: 3600000,
    inactivityTimeout: 3600000,
  },
  callbackUrl: "<CALLBACK_URL>",
};

/*
 * 
 * AUX FUNCTIONS -- DISREGARD 
 * 
 */

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
    let meetingId: string | null = null;
    const meetingSegment = pathSegments.find(segment => segment.startsWith('19%3ameeting_') || segment.startsWith('19:meeting_'));
    if (meetingSegment) {
      const s = meetingSegment.split('meeting_')[1];
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

    console.log('Teams: found: ', meetingId, tenantId, organizationId);

    if (meetingId === null || tenantId === null || organizationId === null) {
      return null;
    }

    return { meetingId, tenantId, organizationId };
  } catch (error) {
    // console.error("Error parsing Teams meeting link:", error); //uncomment to see and expand functionality if they change the URL format
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

type MeetingType = 'meet' | 'zoom' | 'teams';
const defineMeetingInfo = (link: string) => {

  console.log('Splitting Meeting Link')

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
  

  const type = parseMeetingLink();
  console.log('Detected type', type)

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

/*
*
* END AUX FUNCTIONS
*
*/

// Append the botData object to the .env file as a BOT_DATA json variable

//@ts-ignore
const envFilePath = path.join(__dirname, ".env");
let envFileContent = fs.readFileSync(envFilePath, "utf8");

// Delete the existing BOT_DATA line
envFileContent = envFileContent.replace(/BOT_DATA=.*\n?/, "");

const meetingInfo = defineMeetingInfo(decodeURI(url));
const updatedEnvFileContent = `${envFileContent}\nBOT_DATA=${JSON.stringify({ ...botData, meetingInfo})}`;

if (meetingInfo) fs.writeFileSync(envFilePath, updatedEnvFileContent);

console.log("BOT_DATA variable updated in .env file");
