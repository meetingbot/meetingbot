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

const pgTable = pgTableCreator((name) => `backend_${name}`)

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

export const deploymentStatus = z.enum([
  'PENDING',
  'DEPLOYING',
  'DEPLOYED',
  'FAILED',
])
export type DeploymentStatus = z.infer<typeof deploymentStatus>

export const bots = pgTable('bots', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  meetingTitle: varchar('meeting_name', { length: 255 }),
  meetingInfo: json('meeting_info').$type<MeetingInfo>().notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  recording: varchar('recording', { length: 255 }),
  lastHeartbeat: timestamp('last_heartbeat'),
  createdAt: timestamp('created_at').defaultNow(),
  deploymentStatus: varchar('deployment_status', { length: 255 })
    .$type<DeploymentStatus>()
    .notNull()
    .default('PENDING'),
  deploymentError: varchar('deployment_error', { length: 255 }),
})
export const insertBotSchema = createInsertSchema(bots)
  .omit({
    id: true,
    createdAt: true,
    recording: true,
  })
  .extend({
    meetingInfo: meetingInfoSchema,
    deploymentStatus: deploymentStatus,
  })
export const selectBotSchema = createSelectSchema(bots)
  .omit({
    recording: true,
  })
  .extend({
    meetingInfo: meetingInfoSchema,
    deploymentStatus: deploymentStatus,
  })

export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  botId: integer('bot_id')
    .references(() => bots.id)
    .notNull(),
  eventType: varchar('event_type', { length: 255 }).notNull(),
  eventTime: timestamp('event_time').notNull(),
  details: json('details'),
  createdAt: timestamp('created_at').defaultNow(),
})
export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
})
export const selectEventSchema = createSelectSchema(events)
