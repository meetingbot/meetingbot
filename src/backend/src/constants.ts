export const DEFAULT_BOT_VALUES = {
  meetingTitle: 'Meeting',
  botDisplayName: 'MeetingBot',
  botImage: 'https://github.com/user-attachments/assets/d1da779e-73c1-4bdf-8ca5-a1c11b07f33a',
  heartbeatInterval: 5000,
  automaticLeave: {
    silenceDetection: {
      timeout: 300000, // 5 minutes
      activateAfter: 60000, // 1 minute
    },
    botDetection: {
      usingParticipantEvents: {
        timeout: 30000, // 30 seconds
        activateAfter: 10000, // 10 seconds
      },
      usingParticipantNames: {
        timeout: 30000, // 30 seconds
        activateAfter: 10000, // 10 seconds
      },
    },
    waitingRoomTimeout: 300000, // 5 minutes
    noOneJoinedTimeout: 300000, // 5 minutes
    everyoneLeftTimeout: 300000, // 5 minutes
  },
} as const
