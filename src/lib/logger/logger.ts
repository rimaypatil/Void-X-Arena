/**
 * Structured Production JSON Logger
 * Formats all application logs into uniform JSON structures suitable for CloudWatch, Datadog, or ELK.
 * Automatically redacts passwords, tokens, API secrets, and sensitive credentials.
 */

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SECURITY';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  path?: string;
  durationMs?: number;
  statusCode?: number;
  context?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

const REDACTED_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'clientsecret',
  'webhooksecret',
  'authorization',
  'cookie',
  'apikey',
]);

export class Logger {
  /**
   * Recursively redacts sensitive keys from log context
   */
  private static sanitize(obj: any, depth = 0): any {
    if (depth > 5 || obj === null || obj === undefined) return obj;

    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitize(item, depth + 1));
    }

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (REDACTED_KEYS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitize(value, depth + 1);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private static emit(entry: LogEntry) {
    const serialized = JSON.stringify(entry);
    if (entry.level === 'ERROR' || entry.level === 'SECURITY') {
      console.error(serialized);
    } else if (entry.level === 'WARN') {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }
  }

  static info(messageOrObj: any, context?: Record<string, any>, correlationId?: string) {
    if (typeof messageOrObj === 'object' && messageOrObj !== null) {
      const { message, event, correlationId: cid, ...rest } = messageOrObj;
      this.emit({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: message || event || 'INFO',
        correlationId: cid || correlationId,
        context: this.sanitize({ ...rest, ...(context || {}) }),
      });
      return;
    }

    this.emit({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message: String(messageOrObj),
      correlationId,
      context: context ? this.sanitize(context) : undefined,
    });
  }

  static warn(message: string, context?: Record<string, any>, correlationId?: string) {
    this.emit({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      correlationId,
      context: context ? this.sanitize(context) : undefined,
    });
  }

  static error(message: string, error?: any, context?: Record<string, any>, correlationId?: string) {
    this.emit({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      correlationId,
      error: error
        ? {
            message: error.message || String(error),
            code: error.code,
            stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
          }
        : undefined,
      context: context ? this.sanitize(context) : undefined,
    });
  }

  static security(message: string, context?: Record<string, any>, correlationId?: string) {
    this.emit({
      timestamp: new Date().toISOString(),
      level: 'SECURITY',
      message,
      correlationId,
      context: context ? this.sanitize(context) : undefined,
    });
  }

  static request(params: {
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
    correlationId?: string;
    ip?: string;
  }) {
    this.emit({
      timestamp: new Date().toISOString(),
      level: params.statusCode >= 500 ? 'ERROR' : params.statusCode >= 400 ? 'WARN' : 'INFO',
      message: `${params.method} ${params.path} ${params.statusCode} (${params.durationMs}ms)`,
      path: params.path,
      statusCode: params.statusCode,
      durationMs: params.durationMs,
      correlationId: params.correlationId,
      context: { ip: params.ip },
    });
  }
}

export const logger = Logger;
