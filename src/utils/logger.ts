/**
 * Simple logger utility
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  private name: string;
  private level: LogLevel;
  private useStderr: boolean;

  constructor(name: string, level?: LogLevel, useStderr = true) {
    this.name = name;
    this.level = level ?? this.getLogLevelFromEnv();
    this.useStderr = useStderr;
  }

  private getLogLevelFromEnv(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'DEBUG':
        return LogLevel.DEBUG;
      case 'INFO':
        return LogLevel.INFO;
      case 'WARN':
        return LogLevel.WARN;
      case 'ERROR':
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level < this.level) return;

    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level];
    const formattedMessage = `[${timestamp}] [${levelStr}] [${this.name}] ${message}`;

    // For MCP servers, we need to use stderr to avoid interfering with stdout protocol
    if (this.useStderr) {
      console.error(formattedMessage, ...args);
    } else {
      console.log(formattedMessage, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }
}

// Global logger instance
export const globalLogger = new Logger('c0ntextKeeper');

/**
 * Create a child logger with a specific name
 */
export function createLogger(name: string, level?: LogLevel): Logger {
  return new Logger(name, level);
}