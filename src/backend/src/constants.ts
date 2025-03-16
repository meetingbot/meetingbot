export const DEFAULT_BOT_VALUES = {
  meetingTitle: 'Meeting',
  botDisplayName: 'MeetingBot',
  botImage:
    'https://github.com/user-attachments/assets/d1da779e-73c1-4bdf-8ca5-a1c11b07f33a',
  heartbeatInterval: 5000,
  automaticLeave: {
    waitingRoomTimeout: 300000, // 5 minutes
    noOneJoinedTimeout: 300000, // 5 minutes
    everyoneLeftTimeout: 300000, // 5 minutes
  },
} as const
