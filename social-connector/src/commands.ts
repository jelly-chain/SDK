export type CommandHandler = (args: string[], ctx: unknown) => Promise<string>;

export class CommandRegistry {
  private commands: Map<string, CommandHandler> = new Map();

  register(name: string, handler: CommandHandler): void {
    this.commands.set(name.toLowerCase(), handler);
  }

  unregister(name: string): boolean {
    return this.commands.delete(name.toLowerCase());
  }

  async execute(name: string, args: string[], ctx: unknown): Promise<string | null> {
    const handler = this.commands.get(name.toLowerCase());
    if (!handler) return null;
    return handler(args, ctx);
  }

  getCommands(): string[] {
    return Array.from(this.commands.keys());
  }
}
