export const DEFAULT_BOT_CONFIG = {
  botDisplayName: 'Meeting Bot',
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
