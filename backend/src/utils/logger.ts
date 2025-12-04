/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * Log context interface
 */
export interface LogContext {
  [key: string]: unknown
}

/**
 * Logger configuration
 */
interface LoggerConfig {
  enableConsole: boolean
  minLevel: LogLevel
  includeTimestamp: boolean
  includeContext: boolean
}

/**
 * Default logger configuration
 */
const defaultConfig: LoggerConfig = {
  enableConsole: true,
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  includeTimestamp: true,
  includeContext: true,
}

/**
 * Log level priority for filtering
 */
const levelPriority: Record<LogLevel, number> = {
  [LogLevel.ERROR]: 0,
  [LogLevel.WARN]: 1,
  [LogLevel.INFO]: 2,
  [LogLevel.DEBUG]: 3,
}

/**
 * Format log message
 */
function formatLogMessage(
  level: LogLevel,
  message: string,
  context?: LogContext,
  config: LoggerConfig = defaultConfig,
): string {
  const parts: string[] = []

  // Timestamp
  if (config.includeTimestamp) {
    parts.push(`[${new Date().toISOString()}]`)
  }

  // Level
  parts.push(`[${level.toUpperCase()}]`)

  // Message
  parts.push(message)

  // Context
  if (config.includeContext && context && Object.keys(context).length > 0) {
    parts.push(JSON.stringify(context))
  }

  return parts.join(' ')
}

/**
 * Check if log should be output based on level
 */
function shouldLog(level: LogLevel, config: LoggerConfig = defaultConfig): boolean {
  return levelPriority[level] <= levelPriority[config.minLevel]
}

/**
 * Core logging function
 */
function log(
  level: LogLevel,
  message: string,
  context?: LogContext,
  config: LoggerConfig = defaultConfig,
): void {
  if (!config.enableConsole || !shouldLog(level, config)) {
    return
  }

  const formattedMessage = formatLogMessage(level, message, context, config)

  switch (level) {
    case LogLevel.ERROR:
      console.error(formattedMessage)
      break
    case LogLevel.WARN:
      console.warn(formattedMessage)
      break
    case LogLevel.INFO:
      console.info(formattedMessage)
      break
    case LogLevel.DEBUG:
      console.debug(formattedMessage)
      break
  }
}

/**
 * Logger class
 */
class Logger {
  private config: LoggerConfig

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config }
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext): void {
    log(LogLevel.ERROR, message, context, this.config)
  }

  /**
   * Log error with Error object
   */
  errorWithException(message: string, error: Error, context?: LogContext): void {
    this.error(message, {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    })
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    log(LogLevel.WARN, message, context, this.config)
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    log(LogLevel.INFO, message, context, this.config)
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    log(LogLevel.DEBUG, message, context, this.config)
  }

  /**
   * Log HTTP request
   */
  request(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    this.info(`${method} ${path} ${statusCode}`, {
      ...context,
      method,
      path,
      statusCode,
      duration: `${duration}ms`,
    })
  }

  /**
   * Update logger configuration
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger()

/**
 * Create a new logger instance with custom config
 */
export function createLogger(config?: Partial<LoggerConfig>): Logger {
  return new Logger(config)
}

/**
 * Disable logging (for tests)
 */
export function disableLogging(): void {
  logger.updateConfig({ enableConsole: false })
}

/**
 * Enable logging
 */
export function enableLogging(): void {
  logger.updateConfig({ enableConsole: true })
}
