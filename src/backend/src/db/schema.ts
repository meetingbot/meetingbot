import { z } from 'zod'
import {
  serial,
  varchar,
  timestamp,
  json,
  integer,
  pgTableCreator,
} from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'

const pgTable = pgTableCreator((name) => name)

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
})
export const selectUserSchema = createSelectSchema(users)

const silenceDetectionSchema = z.object({
  timeout: z.number().optional(), // the milliseconds of silence before the bot leaves
  activateAfter: z.number().optional(), // the milliseconds the bot waits before it begins to detect silence
})
const botDetectionSchema = z.object({
  usingParticipantEvents: z.object({
    timeout: z.number().optional(), // the milliseconds before the bot leaves the meeting if it detects another bot
    activateAfter: z.number().optional(), // the milliseconds the bot waits before it begins to detect other bots
  }).optional(),
  usingParticipantNames: z.object({
    timeout: z.number().optional(), // the milliseconds before the bot leaves the meeting if it detects another bot
    activateAfter: z.number().optional(), // the milliseconds the bot waits before it begins to detect other bots
  }).optional(),
})
const automaticLeaveSchema = z.object({
  silenceDetection: silenceDetectionSchema.optional(),
  botDetection: botDetectionSchema.optional(),
  waitingRoomTimeout: z.number().optional(), // the milliseconds before the bot leaves the meeting if it is in the waiting room
  noOneJoinedTimeout: z.number().optional(), // the milliseconds before the bot leaves the meeting if no one has joined
  everyoneLeftTimeout: z.number().optional(), // the milliseconds before the bot leaves the meeting if everyone has left
})

export const meetingInfoSchema = z.object({
  meetingId: z.string().optional().describe('Meeting ID'),
  meetingPassword: z.string().optional().describe('Meeting password'),
  meetingUrl: z.string().optional().describe('Meeting URL'),
  organizerId: z.string().optional().describe('Organizer ID'),
  tenantId: z.string().optional().describe('Tenant ID'),
  messageId: z.string().optional().describe('Message ID'),
  threadId: z.string().optional().describe('Thread ID'),
  platform: z.enum(['zoom', 'teams', 'google']).optional().describe('Platform'),
})
export type MeetingInfo = z.infer<typeof meetingInfoSchema>

// Define base status codes
export const status = z.enum([
  'READY_TO_DEPLOY',
  'DEPLOYING',
  'JOINING_CALL',
  'IN_WAITING_ROOM',
  'IN_CALL',
  'CALL_ENDED',
  'DONE',
  'FATAL',
])
export type Status = z.infer<typeof status>

// Event codes include all status codes plus additional event-only codes
const allEventCodes = [
  ...status.options,
  'PARTICIPANT_JOIN',
  'PARTICIPANT_LEAVE',
  'LOG',
] as const

// Define descriptions for all event types
export const EVENT_DESCRIPTIONS = {
  PARTICIPANT_JOIN:
    'A participant has joined the call. The data.participantId will contain the id of the participant.',
  PARTICIPANT_LEAVE:
    'A participant has left the call. The data.participantId will contain the id of the participant.',
  READY_TO_DEPLOY:
    'Resources have been provisioned and the bot is ready internally to join a meeting.',
  DEPLOYING:
    'The bot is in the process of being deployed with the specified configuration.',
  JOINING_CALL:
    'The bot has acknowledged the request to join the call, and is in the process of connecting.',
  IN_WAITING_ROOM: 'The bot is in the waiting room of the meeting.',
  IN_CALL: 'The bot is in the meeting, and is currently recording audio.',
  CALL_ENDED:
    'The bot has left the call. The data.sub_code and data.description will contain the reason for why the call ended.',
  DONE: 'The bot has shut down.',
  FATAL:
    'The bot has encountered an error. The data.sub_code and data.description will contain the reason for the failure.',
  LOG: "Catch-all for any logs that were produced that don't fit any other event type. The data.message will contain the log contents.",
} as const

// Define event codes with descriptions
export const eventCode = z.enum(allEventCodes).describe('Event type code')
export type EventCode = z.infer<typeof eventCode>

export const bots = pgTable('bots', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  meetingTitle: varchar('meeting_name', { length: 255 }),
  meetingInfo: json('meeting_info').$type<MeetingInfo>().notNull(),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  recording: varchar('recording', { length: 255 }),
  lastHeartbeat: timestamp('last_heartbeat'),
  createdAt: timestamp('created_at').defaultNow(),
  status: varchar('status', { length: 255 })
    .$type<Status>()
    .notNull()
    .default('READY_TO_DEPLOY'),
  deploymentError: varchar('deployment_error', { length: 255 }),
})
export const insertBotSchema = createInsertSchema(bots)
  .pick({
    userId: true,
    meetingTitle: true,
    meetingInfo: true,
    startTime: true,
    endTime: true,
    lastHeartbeat: true,
    status: true,
    deploymentError: true,
  })
  .extend({
    meetingInfo: meetingInfoSchema,
    status: status.optional(),
    startTime: z.date().optional(),
    endTime: z.date().optional(),
    botDisplayName: z.string().optional(),
    botImage: z.string().url().optional(),
    heartbeatInterval: z.number().optional(),
    automaticLeave: automaticLeaveSchema.optional(),
  })
export const selectBotSchema = createSelectSchema(bots)
  .pick({
    id: true,
    userId: true,
    meetingTitle: true,
    meetingInfo: true,
    startTime: true,
    endTime: true,
    lastHeartbeat: true,
    createdAt: true,
    status: true,
    deploymentError: true,
  })
  .extend({
    meetingInfo: meetingInfoSchema,
    status: status,
  })

export const botConfigSchema = insertBotSchema
  .pick({
    userId: true,
    meetingInfo: true,
    meetingTitle: true,
    startTime: true,
    endTime: true,
  })
  .extend({
    botDisplayName: z.string().optional(), // the display name of the bot
    botImage: z.string().url().optional(), // the display image of the bot
    heartbeatInterval: z.number().optional(), // the milliseconds between heartbeats
    automaticLeave: automaticLeaveSchema.optional(),
  })
export type BotConfig = z.infer<typeof botConfigSchema>

export const deployBotInputSchema = z.object({
  id: z.number(),
  botConfig: botConfigSchema,
})

const participantJoinData = z.object({
  participantId: z.string(),
})
const participantLeaveData = z.object({
  participantId: z.string(),
})
const logData = z.object({
  message: z.string(),
})
const statusData = z.object({
  sub_code: z.string().optional(),
  description: z.string().optional(),
})

export const eventData = z.union([
  participantJoinData,
  participantLeaveData,
  logData,
  statusData,
])
export type EventData = z.infer<typeof eventData>

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  botId: integer('bot_id')
    .references(() => bots.id)
    .notNull(),
  eventType: varchar('event_type', { length: 255 })
    .$type<EventCode>()
    .notNull(),
  eventTime: timestamp('event_time').notNull(),
  data: json('details').$type<EventData | null>(),
  createdAt: timestamp('created_at').defaultNow(),
})
export const insertEventSchema = createInsertSchema(events)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    data: eventData.nullable(),
    eventType: eventCode,
  })
export const selectEventSchema = createSelectSchema(events).extend({
  data: eventData.nullable(),
  eventType: eventCode,
})
