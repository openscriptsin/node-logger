export interface ILogger {
  info(message: string, ...args: any[]): void
  warn(message: string, ...args: any[]): void
  debug(message: string, ...args: any[]): void
  error(message: string, ...args: any[]): void
}

export const LogLevels = ["INFO", "WARN", "DEBUG", "ERROR"]

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface ILogOptions {
  logDir?: string
  logToFile?: boolean
  logToConsole?: boolean
}

export type WinstonLogLevel = "error" | "warn" | "info" | "debug"
