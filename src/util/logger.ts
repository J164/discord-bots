import pino from 'pino';

/**
 * Logging object used to report information to the console
 */
export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: true,
    },
  },
});
