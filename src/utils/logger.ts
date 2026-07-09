import winston from 'winston';
import { env } from '../config/env';

/**
 * Structured logger. In production this writes JSON lines that a
 * platform like Render can index/search; in development it prints
 * readable, colorized lines.
 */
export const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  format:
    env.NODE_ENV === 'development'
      ? winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'HH:mm:ss' }),
          winston.format.printf(
            ({ timestamp, level, message, ...meta }) =>
              `[${timestamp}] ${level}: ${message} ${
                Object.keys(meta).length ? JSON.stringify(meta) : ''
              }`,
          ),
        )
      : winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console()],
});
