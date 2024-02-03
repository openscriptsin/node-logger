import { ILogger, ILogOptions, LogLevel, LogLevels, WinstonLogLevel } from "./ILogger"
import * as winston from "winston"
import { format, createLogger } from "winston"
import * as _ from "lodash"
import fs from "fs"
import { TYPES } from "./Types"
import { inject, injectable } from "inversify"
import path from "path"
import DailyRotateFile from "winston-daily-rotate-file"
import util from "util"

@injectable()
export class Logger implements ILogger {
  private infoLogger: winston.Logger
  private warnLogger: winston.Logger
  private debugLogger: winston.Logger
  private errorLogger: winston.Logger
  private logLevel: LogLevel

  constructor(
    @inject(TYPES.LogOptions) private logOptions: ILogOptions,
  ) {
    if (
      !_.isNil(process.env.LOG_LEVEL) &&
      LogLevels.includes(process.env.LOG_LEVEL)
    ) {
      this.logLevel = process.env.LOG_LEVEL as unknown as LogLevel
    } else {
      this.logLevel = LogLevel.INFO
    }
    if (
      this.logOptions.logDir &&
      !fs.existsSync(this.logOptions.logDir)
    ) {
      const mkdirp = require("mkdirp")
      mkdirp.sync(this.logOptions.logDir)
    }
    function errorReplacer(key: string, value: any) {
      if (value instanceof Error) {
        return { message: value.message, stack: value.stack }
      }
      return value
    }

    const logFormat = format.printf((info) => {
      return `${JSON.stringify(info, errorReplacer)}`
    })

    this.infoLogger = createLogger({
      transports: this.getWinstonConfig("info"),
      exitOnError: false,
      format: format.combine(
        format.splat(),
        format.simple(),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat,
      ),
    })

    this.warnLogger = createLogger({
      transports: this.getWinstonConfig("warn"),
      exitOnError: false,
      format: format.combine(
        format.splat(),
        format.simple(),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat,
      ),
    })

    this.debugLogger = createLogger({
      transports: this.getWinstonConfig("debug"),
      exitOnError: false,
      format: format.combine(
        format.splat(),
        format.simple(),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat,
      ),
    })

    this.errorLogger = createLogger({
      transports: this.getWinstonConfig("error"),
      exitOnError: false,
      format: format.combine(
        format.splat(),
        format.simple(),
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat,
      ),
    })
  }

  private getWinstonConfig(
    winstonLogLevel: WinstonLogLevel,
  ): any {
    const transports = []
    const logToFile: boolean = !!(
      this.logOptions.logToFile && this.logOptions.logDir
    )
    if (logToFile) {
      transports.push(
        new DailyRotateFile({
          silent: false,
          filename: path.join(
            this.logOptions.logDir || "logs",
            winstonLogLevel + "-%DATE%.log",
          ),
          datePattern: "YYYY-MM-DD",
          maxFiles: 24 * 10,
          level: winstonLogLevel,
          handleExceptions: true,
          zippedArchive: true,
          json: true,
        }),
      )
    }
    if (this.logOptions.logToConsole || !logToFile) {
      transports.push(
        new winston.transports.Console({
          silent: false,
          level: winstonLogLevel,
          handleExceptions: true,
        }),
      )
    }
    return transports
  }

  jsonifyMeta(msg: string, meta: any[]) {
    if (_.isEmpty(meta)) {
      return msg
    }
    return (
      msg +
      " meta: " +
      util.inspect(meta, { depth: 5, compact: true, breakLength: Infinity })
    )
  }

  async info(msg: string, ...meta: any[]) {
    if (this.shouldLogAtLevel(LogLevel.INFO)) {
      this.infoLogger.info(this.jsonifyMeta(msg, meta))
    }
  }

  async warn(msg: string, ...meta: any[]) {
    if (this.shouldLogAtLevel(LogLevel.WARN)) {
      this.warnLogger.info(this.jsonifyMeta(msg, meta))
    }
  }

  async debug(msg: string, ...meta: any[]) {
    if (this.shouldLogAtLevel(LogLevel.DEBUG)) {
      this.debugLogger.debug(this.jsonifyMeta(msg, meta))
    }
  }

  async error(msg: string, ...meta: any[]) {
    if (this.shouldLogAtLevel(LogLevel.ERROR)) {
      this.errorLogger.error(msg, ...meta)
    }
  }
  private shouldLogAtLevel(logLevel: LogLevel): boolean {
    return Number(LogLevel[this.logLevel]) >= logLevel
  }
}
