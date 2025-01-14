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
  meetingLink: z.string().optional().describe('Meeting join URL'),
  meetingId: z.string().optional().describe('Meeting ID'),
  passcode: z.string().optional().describe('Meeting passcode'),
  platform: z
    .enum(['zoom', 'teams', 'google'])
    .optional()
    .describe('Meeting platform'),
})
export type MeetingInfo = z.infer<typeof meetingInfoSchema>

export const bots = pgTable('bots', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  meetingName: varchar('meeting_name', { length: 255 }),
  meetingInfo: json('meeting_info').$type<MeetingInfo>(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})
export const insertBotSchema = createInsertSchema(bots)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    meetingInfo: meetingInfoSchema.describe('Meeting connection information'),
  })
export const selectBotSchema = createSelectSchema(bots).extend({
  meetingInfo: meetingInfoSchema,
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
