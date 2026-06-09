/**
 * World Cup Jelly SDK — Structured Logger
 *
 * Singleton logger with configurable level, destination, and formatting.
 * Supports console output, file output, and structured JSON logging.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  module: string | null;
  context: Record<string, unknown>;
  elapsedMs: number | null;
}

export interface LoggerConfig {
  level: LogLevel;
  destination: 'console' | 'file' | 'both';
  filePath: string;
  colorize: boolean;
  includeTimestamp: boolean;
  includeModule: boolean;
  maxContextDepth: number;
}

const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
  level: 'info',
  destination: 'console',
  filePath: '',
  colorize: true,
  includeTimestamp: true,
  includeModule: true,
  maxContextDepth: 3,
};

const COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m',
  info: '\x1b[32m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  silent: '',
};

const RESET = '\x1b[0m';

export class Logger {
  private static instance: Logger | null = null;
  private config: LoggerConfig;
  private timers = new Map<string, number>();
  private logBuffer: LogEntry[] = [];
  private bufferSize: number;

  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_LOGGER_CONFIG, ...config };
    this.bufferSize = 100;
  }

  static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    } else if (config) {
      Logger.instance.configure(config);
    }
    return Logger.instance;
  }

  static resetInstance(): void {
    Logger.instance = null;
  }

  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[this.config.level];
  }

  private formatEntry(entry: LogEntry): string {
    const parts: string[] = [];

    if (this.config.includeTimestamp) {
      parts.push(`[${entry.timestamp}]`);
    }

    const levelTag = entry.level.toUpperCase().padEnd(5, ' ');
    if (this.config.colorize && entry.level !== 'silent') {
      parts.push(`${COLORS[entry.level]}${levelTag}${RESET}`);
    } else {
      parts.push(levelTag);
    }

    if (this.config.includeModule && entry.module) {
      parts.push(`[${entry.module}]`);
    }

    parts.push(entry.message);

    if (entry.context && Object.keys(entry.context).length > 0) {
      parts.push(JSON.stringify(entry.context, null, 0));
    }

    if (entry.elapsedMs !== null) {
      parts.push(`(${entry.elapsedMs}ms)`);
    }

    return parts.join(' ');
  }

  private log(level: LogLevel, message: string, module: string | null = null, context: Record<string, unknown> = {}, elapsedMs: number | null = null): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      module,
      context: this.truncateContext(context),
      elapsedMs,
    };

    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.bufferSize) {
      this.logBuffer.shift();
    }

    const formatted = this.formatEntry(entry);

    switch (this.config.destination) {
      case 'console':
        this.writeToConsole(level, formatted);
        break;
      case 'file':
        this.writeToFile(formatted);
        break;
      case 'both':
        this.writeToConsole(level, formatted);
        this.writeToFile(formatted);
        break;
    }
  }

  private writeToConsole(level: LogLevel, message: string): void {
    switch (level) {
      case 'error':
        console.error(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      default:
        console.log(message);
    }
  }

  private writeToFile(message: string): void {
    // In Node.js, would use fs.appendFileSync
    // For now, this is a stub — implement with fs in production
    if (this.config.filePath) {
      try {
        const fs = require('fs');
        fs.appendFileSync(this.config.filePath, message + '\n');
      } catch {
        // Silently fail file writes in browser environments
      }
    }
  }

  private truncateContext(ctx: Record<string, unknown>, depth = 0): Record<string, unknown> {
    if (depth >= this.config.maxContextDepth) return { _truncated: true };
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(ctx)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = this.truncateContext(value as Record<string, unknown>, depth + 1);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  debug(message: string, context: Record<string, unknown> = {}): void {
    this.log('debug', message, null, context);
  }

  info(message: string, context: Record<string, unknown> = {}): void {
    this.log('info', message, null, context);
  }

  warn(message: string, context: Record<string, unknown> = {}): void {
    this.log('warn', message, null, context);
  }

  error(message: string, context: Record<string, unknown> = {}): void {
    this.log('error', message, null, context);
  }

  module(moduleName: string): ModuleLogger {
    return new ModuleLogger(this, moduleName);
  }

  startTimer(label: string): void {
    this.timers.set(label, Date.now());
  }

  endTimer(label: string, message: string, level: LogLevel = 'debug'): void {
    const start = this.timers.get(label);
    if (start) {
      this.timers.delete(label);
      this.log(level, message, null, {}, Date.now() - start);
    }
  }

  getBuffer(): LogEntry[] {
    return [...this.logBuffer];
  }

  clearBuffer(): void {
    this.logBuffer = [];
  }
}

export class ModuleLogger {
  constructor(private readonly logger: Logger, private readonly moduleName: string) {}

  debug(message: string, context: Record<string, unknown> = {}): void {
    this.logger.debug(message, context);
  }

  info(message: string, context: Record<string, unknown> = {}): void {
    this.logger.info(message, context);
  }

  warn(message: string, context: Record<string, unknown> = {}): void {
    this.logger.warn(message, context);
  }

  error(message: string, context: Record<string, unknown> = {}): void {
    this.logger.error(message, context);
  }
}
