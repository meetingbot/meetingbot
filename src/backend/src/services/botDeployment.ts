import { type BotConfig, bots } from '../db/schema'
import { eq } from 'drizzle-orm'
import { type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import * as schema from '../db/schema'
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  ECSClient,
  ECSClientConfig,
  RunTaskCommand,
  RunTaskRequest,
} from '@aws-sdk/client-ecs'

// Get the directory path using import.meta.url
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const config: ECSClientConfig = {
  region: process.env.AWS_REGION,
}

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
}

const client = new ECSClient(config)

/**
 * Selects the appropriate bot task definition based on meeting information
 * @param meetingInfo - Information about the meeting, including platform
 * @returns The task definition ARN to use for deployment
 */
export function selectBotTaskDefinition(
  meetingInfo: schema.MeetingInfo
): string {
  const platform = meetingInfo.platform

  switch (platform?.toLowerCase()) {
    case 'google':
      return process.env.ECS_TASK_DEFINITION_MEET || ''
    case 'teams':
      return process.env.ECS_TASK_DEFINITION_TEAMS || ''
    case 'zoom':
      return process.env.ECS_TASK_DEFINITION_ZOOM || ''
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

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
  const dev = process.env.NODE_ENV === 'development'

  // First, update bot status to deploying
  await db.update(bots).set({ status: 'DEPLOYING' }).where(eq(bots.id, botId))

  try {
    // Get the absolute path to the bots directory (parent directory)
    const botsDir = path.resolve(__dirname, '../../../bots')

    // Merge default config with user provided config

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
      callbackUrl: bot.callbackUrl ?? undefined,
    }

    if (dev) {
      // Spawn the bot process
      const botProcess = spawn('pnpm', ['start'], {
        cwd: botsDir,
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
    } else {
      // todo: i'm not sure if this works as intended
      const input: RunTaskRequest = {
        cluster: process.env.ECS_CLUSTER_NAME,
        // taskDefinition: process.env.ECS_TASK_DEFINITION_MEET,
        taskDefinition: selectBotTaskDefinition(bot.meetingInfo),
        launchType: 'FARGATE',
        networkConfiguration: {
          awsvpcConfiguration: {
            // Read subnets from environment variables
            subnets: process.env.ECS_SUBNETS
              ? process.env.ECS_SUBNETS.split(',')
              : [],
            securityGroups: process.env.ECS_SECURITY_GROUPS
              ? process.env.ECS_SECURITY_GROUPS.split(',')
              : [],
            assignPublicIp: 'ENABLED',
          },
        },
        overrides: {
          containerOverrides: [
            {
              name: 'bot',
              environment: [
                {
                  name: 'BOT_DATA',
                  value: JSON.stringify(config),
                },
              ],
            },
          ],
        },
      }

      const command = new RunTaskCommand(input)
      await client.send(command)
    }

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
