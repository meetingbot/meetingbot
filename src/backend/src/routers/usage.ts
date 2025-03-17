import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../server/trpc'
import {
    events,
    insertEventSchema,
    selectEventSchema,
    EVENT_DESCRIPTIONS,
    bots,
    dailyUsageSchema,
} from '../db/schema'
import { eq, not, and, isNull, isNotNull } from 'drizzle-orm'

export const usageRouter = createTRPCRouter({

    //TOOD: Split this into Monthly, Yearly etc.
    getDayUsage: protectedProcedure
        .meta({
            openapi: {
                method: 'GET',
                path: '/usage/day',
                description: 'Retrive a list of daily bot usage over the last week.\n'
            },
        })
        .input(z.object({}))
        .output(z.array(dailyUsageSchema))
        .query(async ({ ctx }) => {

            // Get all bots timestamp
            const userBots = await ctx.db
                .select({ startTime: bots.startTime, endTime: bots.lastHeartbeat, id: bots.id }) //TODO: End Time reflects this
                .from(bots)
                .where(and(eq(bots.userId, ctx.auth.userId), isNotNull(bots.lastHeartbeat)))

            // Collect the Bot Id's.
            const botIds = userBots.map((bot) => bot.id)
            if (botIds.length === 0) {
                return []
            }

            // Ensure botId is defined before using it in the query
            const botId = botIds[0]
            if (botId === undefined) {
                throw new Error('Bot not found')
            }

            // Create a list of days

            const eventsByDate: { [date: string]: any } = {}

            userBots.forEach((bot) => {

                if (bot.endTime === null) {
                    return; //next in loop
                }

                // Get the start date
                const startDate = bot.startTime.toISOString().split('T')[0]
                if (!eventsByDate[startDate]) {
                    eventsByDate[startDate] = {
                        date: startDate,
                        count: 0,
                        msEllapsed: 0,
                    }
                }

                //Time the bot ellapsed
                const botElapsed = new Date(bot.endTime.toISOString()).getTime() - new Date(bot.startTime.toISOString()).getTime()
                eventsByDate[startDate].msEllapsed += botElapsed
                eventsByDate[startDate].count += 1
            });

            const outputObject = Object.values(eventsByDate);

            // Passback List of values
            console.log(outputObject);
            return outputObject;
        })
});