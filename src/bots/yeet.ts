import { env } from 'node:process';
import { pino } from 'pino';
import { YeetClient } from '../bot-clients/yeet-client.js';

const yeetClient = new YeetClient(
	{
		logger: pino({ name: 'Yeet Bot' }),
		tenorKey: env.TENOR_KEY ?? '',
	},
	env.YEET_STATUS,
);

await yeetClient.login(env.YEET_TOKEN);
