import { type BotConfig, bots } from '../db/schema'
import { eq } from 'drizzle-orm'
import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from '../db/schema'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the directory path using import.meta.url
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class BotDeploymentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BotDeploymentError'
  }
}

export async function deployBot({
  botId,
  db,
}: {
  botId: number
  db: PostgresJsDatabase<typeof schema>
}) {
  const botResult = await db.select().from(bots).where(eq(bots.id, botId))
  if (!botResult[0]) {
    throw new Error('Bot not found')
  }
  const bot = botResult[0]

  // First, update bot status to deploying
  await db.update(bots).set({ status: 'DEPLOYING' }).where(eq(bots.id, botId))

  try {
    // Get the absolute path to the meet bot directory
    const meetDir = path.resolve(__dirname, '../../../bots/meet')

    // Merge default config with user provided config
    // const mergedConfig: BotConfig = merge({}, DEFAULT_BOT_CONFIG, botConfig)

    const config: BotConfig = {
      id: botId,
      userId: bot.userId,
      meetingTitle: bot.meetingTitle,
      meetingInfo: bot.meetingInfo,
      startTime: bot.startTime,
      endTime: bot.endTime,
      botDisplayName: bot.botDisplayName,
      botImage: bot.botImage ?? undefined,
      heartbeatInterval: bot.heartbeatInterval,
      automaticLeave: bot.automaticLeave,
    }

    // Spawn the bot process
    const botProcess = spawn('pnpm', ['dev'], {
      cwd: meetDir,
      env: {
        ...process.env,
        BOT_DATA: JSON.stringify(config),
      },
    })

    // Log output for debugging
    botProcess.stdout.on('data', (data) => {
      console.log(`Bot ${botId} stdout: ${data}`)
    })
    botProcess.stderr.on('data', (data) => {
      console.error(`Bot ${botId} stderr: ${data}`)
    })
    botProcess.on('error', (error) => {
      console.error(`Bot ${botId} process error:`, error)
    })

    // Update status to joining call
    const result = await db
      .update(bots)
      .set({
        status: 'JOINING_CALL',
        deploymentError: null,
      })
      .where(eq(bots.id, botId))
      .returning()

    if (!result[0]) {
      throw new BotDeploymentError('Bot not found')
    }

    return result[0]
  } catch (error) {
    // Update status to fatal and store error message
    await db
      .update(bots)
      .set({
        status: 'FATAL',
        deploymentError:
          error instanceof Error ? error.message : 'Unknown error',
      })
      .where(eq(bots.id, botId))

    throw error
  }
}

export async function shouldDeployImmediately(
  startTime: Date | undefined | null
): Promise<boolean> {
  if (!startTime) return true

  const now = new Date()
  const deploymentBuffer = 5 * 60 * 1000 // 5 minutes in milliseconds
  return startTime.getTime() - now.getTime() <= deploymentBuffer
}
