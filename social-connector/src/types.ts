export type Platform = 'discord' | 'telegram' | 'slack' | 'x' | 'reddit' | 'lens' | 'farcaster';

export interface SocialNotification {
  platform: Platform;
  channel: string;
  message: string;
  embeds?: { title: string; description: string; color?: number }[];
  timestamp: number;
}

export interface BotConfig {
  platforms: Platform[];
  discordToken?: string;
  telegramToken?: string;
  slackToken?: string;
}

export interface NotificationConfig {
  discord?: { webhookUrl: string };
  telegram?: { botToken: string; chatId: string };
  slack?: { webhookUrl: string };
}
