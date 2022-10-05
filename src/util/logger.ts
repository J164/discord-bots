import { pino } from 'pino';

/** Logger used to report information to the console */
export const logger = pino({
	transport: {
		target: 'pino-pretty',
		options: {
			colorize: true,
			translateTime: true,
		},
	},
});
