import { type BotConfig, bots } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "~/server/db/schema";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import {
  ECSClient,
  type ECSClientConfig,
  RunTaskCommand,
  type RunTaskRequest,
} from "@aws-sdk/client-ecs";
import { env } from "~/env";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Get the directory path using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: ECSClientConfig = {
  region: env.AWS_REGION,
};

if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
  config.credentials = {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  };
}

const client = new ECSClient(config);

// Docker CLI helper functions
async function runDockerCommand(command: string): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr && !stderr.includes('WARNING')) {
      console.warn('Docker command warning:', stderr);
    }
    return stdout.trim();
  } catch (err) {
    console.error('Docker command failed:', command, err);
    throw err;
  }
}

/**
 * Selects the appropriate bot task definition based on meeting information
 * @param meetingInfo - Information about the meeting, including platform
 * @returns The task definition ARN to use for deployment
 */
export function selectBotTaskDefinition(
  meetingInfo: schema.MeetingInfo,
): string {
  const platform = meetingInfo.platform;

  switch (platform?.toLowerCase()) {
    case "google":
      return env.ECS_TASK_DEFINITION_MEET;
    case "teams":
      return env.ECS_TASK_DEFINITION_TEAMS;
    case "zoom":
      return env.ECS_TASK_DEFINITION_ZOOM;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Selects the appropriate Docker image based on meeting platform
 * @param meetingInfo - Information about the meeting, including platform
 * @returns The Docker image name to use for deployment
 */
export function selectBotDockerImage(
  meetingInfo: schema.MeetingInfo,
): string {
  const platform = meetingInfo.platform;

  switch (platform?.toLowerCase()) {
    case "google":
      return "meetingbot-meet:latest";
    case "teams":
      return "meetingbot-teams:latest";
    case "zoom":
      return "meetingbot-zoom:latest";
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Deploys a bot using Docker Compose
 * @param config - Bot configuration
 * @param botId - Bot ID
 * @returns Promise<void>
 */
export async function deployBotWithDockerCompose(
  config: BotConfig,
  botId: number,
): Promise<void> {
  // Verify Docker is available
  try {
    await runDockerCommand('docker --version');
  } catch {
    throw new Error('Docker is not available. Make sure Docker is installed and running.');
  }

  const platform = config.meetingInfo.platform?.toLowerCase();
  if (!platform) {
    throw new Error("Platform not specified in meeting info");
  }

  const imageName = selectBotDockerImage(config.meetingInfo);
  const containerName = `meetingbot-bot-${botId}`;
  const network = env.BOT_NETWORK ?? "meetingbot_network";

  // Environment variables for the bot container
  const envVars = [
    `-e BOT_DATA='${JSON.stringify(config)}'`,
    `-e AWS_BUCKET_NAME=${env.AWS_BUCKET_NAME}`,
    `-e AWS_REGION=${env.AWS_REGION}`,
    `-e AWS_ACCESS_KEY_ID=${env.AWS_ACCESS_KEY_ID}`,
    `-e AWS_SECRET_ACCESS_KEY=${env.AWS_SECRET_ACCESS_KEY}`,
    `-e S3_ENDPOINT=${env.S3_ENDPOINT}`,
    `-e S3_FORCE_PATH_STYLE=${env.S3_FORCE_PATH_STYLE}`,
    `-e BACKEND_URL=${env.NEXTAUTH_URL ?? 'http://server:3000'}/api/trpc`,
    `-e NODE_ENV=production`,
    `-e DISPLAY=:99`,
  ].join(' ');

  try {
    // Create and start the bot container using Docker CLI
    const dockerCommand = [
      'docker run',
      '-d', // detached mode
      '--rm', // remove container when it stops
      `--name ${containerName}`,
      `--network ${network}`,
      '--shm-size=2g', // 2GB shared memory for browsers
      envVars,
      imageName
    ].join(' ');

    console.log(`Starting bot container with command: ${dockerCommand}`);
    const containerId = await runDockerCommand(dockerCommand);
    console.log(`Started bot container ${containerName} (${containerId}) for bot ${botId}`);

    // Start log streaming in the background (don't await)
    streamContainerLogs(containerName, botId).catch(error => {
      console.error(`Failed to stream logs for bot ${botId}:`, error);
    });

  } catch (error) {
    console.error(`Failed to deploy bot ${botId} with Docker:`, error);
    throw error;
  }
}

// Helper function to stream container logs
async function streamContainerLogs(containerName: string, botId: number): Promise<void> {
  try {
    const logCommand = `docker logs -f ${containerName}`;
    const logProcess = exec(logCommand);
    
    logProcess.stdout?.on('data', (data: Buffer) => {
      console.log(`Bot ${botId} stdout:`, data.toString());
    });
    
    logProcess.stderr?.on('data', (data: Buffer) => {
      console.log(`Bot ${botId} stderr:`, data.toString());
    });
    
    logProcess.on('error', (error) => {
      console.error(`Bot ${botId} log stream error:`, error);
    });
    
  } catch (error) {
    console.error(`Failed to start log streaming for bot ${botId}:`, error);
  }
}

export class BotDeploymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BotDeploymentError";
  }
}

export async function deployBot({
  botId,
  db,
}: {
  botId: number;
  db: PostgresJsDatabase<typeof schema>;
}) {
  const botResult = await db.select().from(bots).where(eq(bots.id, botId));
  if (!botResult[0]) {
    throw new Error("Bot not found");
  }
  const bot = botResult[0];
  const dev = env.NODE_ENV === "development";
  const isDockerCompose = env.DEPLOYMENT_MODE === "docker-compose";

  // First, update bot status to deploying
  await db.update(bots).set({ status: "DEPLOYING" }).where(eq(bots.id, botId));

  try {
    // Get the absolute path to the bots directory (parent directory)
    const botsDir = path.resolve(__dirname, "../../../../../bots");

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
    };

    if (dev) {
      // Spawn the bot process for local development
      const botProcess = spawn("pnpm", ["start"], {
        cwd: botsDir,
        env: {
          ...process.env,
          BOT_DATA: JSON.stringify(config),
        },
      });

      // Log output for debugging
      botProcess.stdout.on("data", (data) => {
        console.log(`Bot ${botId} stdout: ${data}`);
      });
      botProcess.stderr.on("data", (data) => {
        console.error(`Bot ${botId} stderr: ${data}`);
      });
      botProcess.on("error", (error) => {
        console.error(`Bot ${botId} process error:`, error);
      });
    } else if (isDockerCompose) {
      // Deploy bot using Docker Compose
      await deployBotWithDockerCompose(config, botId);
    } else {
      // Deploy bot using AWS ECS (original behavior)
      const input: RunTaskRequest = {
        cluster: env.ECS_CLUSTER_NAME,
        taskDefinition: selectBotTaskDefinition(bot.meetingInfo),
        launchType: "FARGATE",
        networkConfiguration: {
          awsvpcConfiguration: {
            subnets: env.ECS_SUBNETS,
            securityGroups: env.ECS_SECURITY_GROUPS,
            assignPublicIp: "ENABLED",
          },
        },
        overrides: {
          containerOverrides: [
            {
              name: "bot",
              environment: [
                {
                  name: "BOT_DATA",
                  value: JSON.stringify(config),
                },
              ],
            },
          ],
        },
      };

      const command = new RunTaskCommand(input);
      await client.send(command);
    }

    // Update status to joining call
    const result = await db
      .update(bots)
      .set({
        status: "JOINING_CALL",
        deploymentError: null,
      })
      .where(eq(bots.id, botId))
      .returning();

    if (!result[0]) {
      throw new BotDeploymentError("Bot not found");
    }

    return result[0];
  } catch (error) {
    // Update status to fatal and store error message
    await db
      .update(bots)
      .set({
        status: "FATAL",
        deploymentError:
          error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(bots.id, botId));

    throw error;
  }
}

export async function shouldDeployImmediately(
  startTime: Date | undefined | null,
): Promise<boolean> {
  if (!startTime) return true;

  const now = new Date();
  const deploymentBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
  return startTime.getTime() - now.getTime() <= deploymentBuffer;
}
