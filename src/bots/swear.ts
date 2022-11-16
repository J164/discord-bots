import { env } from 'node:process';
import { pino } from 'pino';
import { SwearClient } from '../bot-clients/swear-client.js';

const swearClient = new SwearClient(
	{
		logger: pino({ name: 'Swear Bot' }),
		admin: env.ADMIN ?? '',
		swear: env.SWEAR ?? '',
	},
	env.SWEAR_STATUS ?? '',
);

await swearClient.login(env.SWEAR_TOKEN);
