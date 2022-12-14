import { env } from 'node:process';
import { GatewayIntentBits, Partials, ActivityType } from 'discord.js';
import { pino } from 'pino';
import { type GlobalInfo } from '../types/bot-types/crystal.js';
import { BotClient } from '../util/bot-client.js';

const logger = pino({ name: 'Crystal Bot' });

const crystalClient = new BotClient<GlobalInfo>(
	{
		intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
		partials: [Partials.Channel],
		presence: {
			activities: [{ name: env.CRYSTAL_STATUS ?? '', type: ActivityType.Playing }],
		},
	},
	'crystal',
	logger,
	{},
);

await crystalClient.login(env.CRYSTAL_TOKEN);
