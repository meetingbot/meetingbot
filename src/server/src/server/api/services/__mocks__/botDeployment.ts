import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "~/server/db/schema";
import { eq } from "drizzle-orm";

// Mock implementation of deployBot
export const deployBot = jest.fn().mockImplementation(async ({ 
  botId, 
  db 
}: { 
  botId: number; 
  db: PostgresJsDatabase<typeof schema> 
}) => {
  const botResult = await db.select().from(schema.bots).where(eq(schema.bots.id, botId));
  if (!botResult[0]) throw new Error("Bot not found");
  
  // Update the bot status and return it
  const updatedBot = await db
    .update(schema.bots)
    .set({ status: "JOINING_CALL" })
    .where(eq(schema.bots.id, botId))
    .returning();
  
  return updatedBot[0];
});

// Mock implementation of shouldDeployImmediately
export const shouldDeployImmediately = jest.fn().mockReturnValue(false);

// Mock implementation of selectBotTaskDefinition
export const selectBotTaskDefinition = jest.fn().mockReturnValue("mock-task-definition");

// Mock implementation of BotDeploymentError
export class BotDeploymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BotDeploymentError";
  }
} 