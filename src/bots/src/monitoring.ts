import { type EventCode, Status } from "./types";
import { trpc } from "./trpc";
import { setTimeout } from "timers/promises";

// Start heartbeat loop in the background
export const startHeartbeat = async (
  botId: number,
  abortSignal: AbortSignal
) => {
  while (!abortSignal.aborted) {
    try {
      await trpc.bots.heartbeat.mutate({ id: botId });
      console.log(`[${new Date().toISOString()}] Heartbeat sent`);
    } catch (error) {
      console.error("Failed to send heartbeat:", error);
    }
    await setTimeout(5000); // Send heartbeat every 5 seconds
  }
};

// Function to report events
export const reportEvent = async (
  botId: number,
  eventType: EventCode,
  eventData: any = null
) => {
  try {
    // Report event
    await trpc.bots.reportEvent.mutate({
      id: botId,
      event: {
        eventType,
        eventTime: new Date(),
        data: eventData
          ? {
              description: eventData.message || eventData.description,
              sub_code: eventData.sub_code,
            }
          : null,
      },
    });

    // Update bot status if this event type is a valid status
    if (eventType in Status) {
      await trpc.bots.updateBotStatus.mutate({
        id: botId,
        status: eventType as unknown as Status,
      });
    }

    console.log(`[${new Date().toISOString()}] Event reported: ${eventType}`);
  } catch (error) {
    console.error("Failed to report event:", error);
  }
};
