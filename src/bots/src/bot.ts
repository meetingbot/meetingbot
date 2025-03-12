import { type BotConfig, type EventCode } from "./types";

export interface BotInterface {
  readonly settings: BotConfig;
  onEvent: (eventType: EventCode, data?: any) => Promise<void>;
  getRecordingPath(): string;
  getContentType(): string;
  run(): Promise<void>;
}

export class Bot implements BotInterface {
  readonly settings: BotConfig;
  onEvent: (eventType: EventCode, data?: any) => Promise<void>;

  constructor(
    settings: BotConfig,
    onEvent: (eventType: EventCode, data?: any) => Promise<void>
  ) {
    this.settings = settings;
    this.onEvent = onEvent;
  }

  async run(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  getRecordingPath(): string {
    throw new Error("Method not implemented.");
  }

  getContentType(): string {
    throw new Error("Method not implemented.");
  }
}
