import { type BotConfig, bots } from '../db/schema'
import { eq } from 'drizzle-orm'
import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from '../db/schema'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import { DEFAULT_BOT_CONFIG } from '../constants'
import { merge } from 'lodash-es'

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
  botConfig,
  db,
}: {
  botId: number
  botConfig: BotConfig
  db: PostgresJsDatabase<typeof schema>
}) {
  // First, update bot status to deploying
  await db.update(bots).set({ status: 'DEPLOYING' }).where(eq(bots.id, botId))

  try {
    // Ensure it's a Google Meet URL
    if (!botConfig.meetingInfo.meetingUrl?.includes('meet.google.com')) {
      throw new BotDeploymentError(
        'Only Google Meet URLs are supported at this time'
      )
    }

    // Get the absolute path to the meets bot directory
    const meetsDir = path.resolve(__dirname, '../../../bots/meets')

    // Merge default config with user provided config
    const mergedConfig = merge({}, DEFAULT_BOT_CONFIG, botConfig)

    const botData = {
      botId,
      meetingUrl: mergedConfig.meetingInfo.meetingUrl,
      name: mergedConfig.botDisplayName,
      recordingPath: './recording.mp4',
      automaticLeave: mergedConfig.automaticLeave,
    }

    // Spawn the bot process
    const botProcess = spawn('pnpm', ['dev'], {
      cwd: meetsDir,
      env: {
        ...process.env,
        BOT_DATA: JSON.stringify(botData),
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
