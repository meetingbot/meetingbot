import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../server/trpc'
import { bots, dailyUsageSchema } from '../db/schema'
import { eq, and, isNotNull, gte } from 'drizzle-orm'

// Interface matching dailyUsageSchema exactly
interface DayUsage {
  date: string;
  count: number;
  msEllapsed: number;
  estimatedCost: string;
}

const formatDayUsageDictToOutput = (eventsByDate: { [date: string]: DayUsage }) => {
  // Create Output Object (list of dates)
  let outputObject = Object.values(eventsByDate)

  // The estimatedCost is already a string, so we don't need to convert it
  // Sort output keys (date)
  return outputObject.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
}

export const usageRouter = createTRPCRouter({
  getAllUsage: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/usage',
        description:
          'Retreive a sorted list of daily bot usage over all time\n',
      },
    })
    .input(z.object({}))
    .output(z.array(dailyUsageSchema))
    .query(async ({ ctx }) => {
      // Get all bots timestamp
      const userBots = await ctx.db
        .select({
          startTime: bots.startTime,
          endTime: bots.lastHeartbeat,
          id: bots.id,
        }) //TODO: End Time reflects this
        .from(bots)
        .where(
          and(eq(bots.userId, ctx.auth.userId), isNotNull(bots.lastHeartbeat))
        )

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
      const eventsByDate: { [date: string]: DayUsage } = {}

      userBots.forEach((bot) => {
        if (bot.endTime === null) {
          return //next in loop
        }

        // Get the start date
        const startDate = bot.startTime.toISOString().split('T')[0]
        
        // Initialize this date if it doesn't exist
        if (startDate && !eventsByDate[startDate]) {
          eventsByDate[startDate] = {
            date: startDate,
            count: 0,
            msEllapsed: 0,
            estimatedCost: "0",
          }
        }

        //Time the bot ellapsed
        const botElapsed =
          new Date(bot.endTime.toISOString()).getTime() -
          new Date(bot.startTime.toISOString()).getTime()
          
        // Ensure properties exist before accessing them
        if (startDate && eventsByDate[startDate]) {
          eventsByDate[startDate].msEllapsed += botElapsed
          eventsByDate[startDate].count += 1
        }
      })

      // Create Output Object (list of dates)
      let outputObject = Object.values(eventsByDate)

      // Alter to include a cost variable
      outputObject = outputObject.map((d) => {
        return {
          ...d,
          estimatedCost: (d.msEllapsed / 36000000).toFixed(2),
        }
      })

      // Sort by keys
      outputObject = outputObject.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      // Passback List of values
      console.log(outputObject)
      return outputObject
    }),

  getWeekDailyUsage: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/usage/week',
        description:
          'Retreive a list of daily bot usage over the last week. Empty days will be reported as well.\n',
      },
    })
    .input(z.object({}))
    .output(z.array(dailyUsageSchema))
    .query(async ({ ctx }) => {
      // Calculate start of this week
      const today = new Date()
      const startOfWeek = new Date(
        today.setDate(today.getDate() - today.getDay())
      )

      // Get all bots timestamp
      const userBots = await ctx.db
        .select({
          startTime: bots.startTime,
          endTime: bots.lastHeartbeat,
          id: bots.id,
        }) //TODO: End Time reflects this
        .from(bots)
        .where(
          and(
            eq(bots.userId, ctx.auth.userId),
            gte(bots.startTime, startOfWeek), // After the beginning of the week
            isNotNull(bots.lastHeartbeat)
          )
        )

      // Empty -- No Data
      if (userBots.length === 0) {
        return []
      }

      // Populate entries for each day of the week
      const eventsByDate: { [date: string]: DayUsage } = {}
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek)
        currentDate.setDate(startOfWeek.getDate() + i)
        const dateString = currentDate.toISOString().split('T')[0]

        if (dateString && !eventsByDate[dateString]) {
          eventsByDate[dateString] = {
            date: dateString,
            count: 0,
            msEllapsed: 0,
            estimatedCost: "0",
          }
        }
      }

      userBots.forEach((bot) => {
        // Did not finish
        if (bot.endTime === null) {
          return //next in loop
        }

        // Get the start date
        const startDate = bot.startTime.toISOString().split('T')[0]

        //Time the bot ellapsed
        const botElapsed =
          new Date(bot.endTime.toISOString()).getTime() -
          new Date(bot.startTime.toISOString()).getTime()
          
        // Check if the date exists before accessing it
        if (startDate && eventsByDate[startDate]) {
          eventsByDate[startDate].msEllapsed += botElapsed
          eventsByDate[startDate].count += 1
          // Convert to string when saving
          const currentCost = parseFloat(eventsByDate[startDate].estimatedCost);
          eventsByDate[startDate].estimatedCost = (currentCost + botElapsed / 36000000).toFixed(2);
        }
      })

      // Return proper format
      return formatDayUsageDictToOutput(eventsByDate)
    }),

  getMonthDailyUsage: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/usage/month',
        description:
          'Retreive a list of daily bot usage over the last month. Empty days will be reported as well.\n',
      },
    })
    .input(z.object({}))
    .output(z.array(dailyUsageSchema))
    .query(async ({ ctx }) => {
      // Calculate start of this week
      const today = new Date()
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      const daysInMonth = endOfMonth.getDate()

      // Get all bots timestamp
      const userBots = await ctx.db
        .select({
          startTime: bots.startTime,
          endTime: bots.lastHeartbeat,
          id: bots.id,
        }) //TODO: End Time reflects this
        .from(bots)
        .where(
          and(
            eq(bots.userId, ctx.auth.userId),
            gte(bots.startTime, startOfMonth), // After the beginning of the week
            isNotNull(bots.lastHeartbeat)
          )
        )

      // Empty -- No Data
      if (userBots.length === 0) {
        return []
      }

      // Populate entries for each day of the week
      const eventsByDate: { [date: string]: DayUsage } = {}

      for (let i = 0; i <= daysInMonth; i++) {
        const currentDate = new Date(startOfMonth)
        currentDate.setDate(startOfMonth.getDate() + i)
        const dateString = currentDate.toISOString().split('T')[0]

        if (dateString && !eventsByDate[dateString]) {
          eventsByDate[dateString] = {
            date: dateString,
            count: 0,
            msEllapsed: 0,
            estimatedCost: "0",
          }
        }
      }

      userBots.forEach((bot) => {
        // Did not finish
        if (bot.endTime === null) {
          return //next in loop
        }

        // Get the start date
        const startDate = bot.startTime.toISOString().split('T')[0]

        //Time the bot ellapsed
        const botElapsed =
          new Date(bot.endTime.toISOString()).getTime() -
          new Date(bot.startTime.toISOString()).getTime()
          
        // Check if the date exists before accessing it
        if (startDate && eventsByDate[startDate]) {
          eventsByDate[startDate].msEllapsed += botElapsed
          eventsByDate[startDate].count += 1
          // Convert to string when saving
          const currentCost = parseFloat(eventsByDate[startDate].estimatedCost);
          eventsByDate[startDate].estimatedCost = (currentCost + botElapsed / 36000000).toFixed(2);
        }
      })

      return formatDayUsageDictToOutput(eventsByDate)
    }),
})
