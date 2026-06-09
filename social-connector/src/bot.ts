import { Client, GatewayIntentBits } from '../types.js';
import { CommandRegistry } from './commands.js';

export interface BotConfig {
  platforms: ('discord' | 'telegram' | 'slack')[];
  discordToken?: string;
  telegramToken?: string;
  slackToken?: string;
  prefix?: string;
}

export abstract class BaseBot {
  protected registry = new CommandRegistry();
  abstract platform: string;

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;

  registerCommand(name: string, handler: (args: string[], ctx: unknown) => Promise<string>): void {
    this.registry.register(name, handler);
  }

  async handleMessage(message: string, ctx: unknown): Promise<string | null> {
    const parts = message.trim().split(/\s+/);
    if (parts.length === 0) return null;
    const cmd = parts[0];
    const args = parts.slice(1);
    return this.registry.execute(cmd, args, ctx);
  }
}

export class DiscordBot extends BaseBot {
  platform = 'discord';
  constructor(private token: string) { super(); }
  async start() { /* Discord.js client setup */ }
  async stop() { /* Discord.js destroy */ }
}

export class TelegramBot extends BaseBot {
  platform = 'telegram';
  constructor(private token: string) { super(); }
  async start() { /* Bot API long polling */ }
  async stop() { /* Stop polling */ }
}

export class SlackBot extends BaseBot {
  platform = 'slack';
  constructor(private token: string) { super(); }
  async start() { /* Slack Bolt setup */ }
  async stop() { /* Slack disconnect */ }
}

export class SocialBotFactory {
  static create(config: BotConfig): BaseBot[] {
    const bots: BaseBot[] = [];
    if (config.platforms.includes('discord') && config.discordToken) {
      bots.push(new DiscordBot(config.discordToken));
    }
    if (config.platforms.includes('telegram') && config.telegramToken) {
      bots.push(new TelegramBot(config.telegramToken));
    }
    if (config.platforms.includes('slack') && config.slackToken) {
      bots.push(new SlackBot(config.slackToken));
    }
    return bots;
  }
}
