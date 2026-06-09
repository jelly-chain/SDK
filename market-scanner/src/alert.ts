import { AlertConfig, ScannerSignal } from '../types.js';

export class AlertDispatcher {
  private config: AlertConfig;
  private readonly minConfidence: number;

  constructor(config: AlertConfig) {
    this.config = config;
    this.minConfidence = config.minConfidence ?? 0.5;
  }

  /**
   * Dispatch a signal to all configured channels.
   */
  async dispatch(signal: ScannerSignal): Promise<void> {
    if (signal.confidence < this.minConfidence) return;

    const promises: Promise<void>[] = [];

    if (this.config.webhook) {
      promises.push(this.dispatchWebhook(signal));
    }
    if (this.config.discord) {
      promises.push(this.dispatchDiscord(signal));
    }
    if (this.config.telegram) {
      promises.push(this.dispatchTelegram(signal));
    }

    await Promise.allSettled(promises);
  }

  private async dispatchWebhook(signal: ScannerSignal): Promise<void> {
    if (!this.config.webhook) return;
    try {
      await fetch(this.config.webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signal),
      });
    } catch (err) {
      console.error('Webhook dispatch failed:', err);
    }
  }

  private async dispatchDiscord(signal: ScannerSignal): Promise<void> {
    if (!this.config.discord) return;
    const color = signal.type === 'smartMoney' ? 0x00ff00 :
      signal.type === 'volumeSpike' ? 0xffaa00 :
      signal.type === 'newListing' ? 0x00aaff : 0xff00ff;

    const embed = {
      title: `🔍 ${signal.type} — ${signal.tokenSymbol}`,
      fields: [
        { name: 'Chain', value: signal.chain, inline: true },
        { name: 'Confidence', value: `${(signal.confidence * 100).toFixed(1)}%`, inline: true },
        { name: 'Token', value: signal.tokenAddress, inline: false },
      ],
      color,
      timestamp: new Date(signal.timestamp).toISOString(),
    };

    try {
      await fetch(this.config.discord, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      });
    } catch (err) {
      console.error('Discord dispatch failed:', err);
    }
  }

  private async dispatchTelegram(signal: ScannerSignal): Promise<void> {
    if (!this.config.telegram) return;
    const { botToken, chatId } = this.config.telegram;
    const text = `🔍 *${signal.type}*\n` +
      `Chain: \`${signal.chain}\`\n` +
      `Token: \`${signal.tokenSymbol}\`\n` +
      `Confidence: ${(signal.confidence * 100).toFixed(1)}%\n` +
      `Address: \`${signal.tokenAddress}\``;

    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'MarkdownV2' }),
      });
    } catch (err) {
      console.error('Telegram dispatch failed:', err);
    }
  }
}
