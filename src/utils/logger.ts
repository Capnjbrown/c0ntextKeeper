/**
 * Simple logger utility with file logging support
 */

import * as fs from 'fs';
import * as path from 'path';

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
  private static logFile: string | null = null;
  private static logStream: fs.WriteStream | null = null;
  private static logDir: string = path.join(process.env.HOME || '', '.c0ntextkeeper', 'logs');

  constructor(name: string, level?: LogLevel, useStderr = true) {
    this.name = name;
    this.level = level ?? this.getLogLevelFromEnv();
    this.useStderr = useStderr;
    
    // Initialize file logging if enabled
    if (process.env.C0NTEXTKEEPER_FILE_LOGGING === 'true' && !Logger.logStream) {
      this.initializeFileLogging();
    }
  }

  private initializeFileLogging(): void {
    try {
      // Create logs directory if it doesn't exist
      if (!fs.existsSync(Logger.logDir)) {
        fs.mkdirSync(Logger.logDir, { recursive: true });
      }

      // Create daily log file
      const date = new Date().toISOString().split('T')[0];
      Logger.logFile = path.join(Logger.logDir, `${date}-hook.log`);
      
      // Open stream in append mode
      Logger.logStream = fs.createWriteStream(Logger.logFile, { flags: 'a' });
      
      // Log initialization
      this.writeToFile('INFO', 'Logger', 'File logging initialized');
    } catch {
      // Silently fail if we can't create log file
      Logger.logStream = null;
    }
  }

  private writeToFile(level: string, name: string, message: string, ...args: any[]): void {
    if (Logger.logStream) {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] [${level}] [${name}] ${message} ${args.length > 0 ? JSON.stringify(args) : ''}\n`;
      Logger.logStream.write(logEntry);
    }
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

    // Write to file if enabled
    this.writeToFile(levelStr, this.name, message, ...args);

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