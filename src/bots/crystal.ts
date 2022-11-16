import { env } from 'node:process';
import { pino } from 'pino';
import { CrystalClient } from '../bot-clients/crystal-client.js';

const crystalClient = new CrystalClient(
	{
		logger: pino({ name: 'Crystal Bot' }),
	},
	env.CRYSTAL_STATUS ?? '',
);

await crystalClient.login(env.CRYSTAL_TOKEN);
