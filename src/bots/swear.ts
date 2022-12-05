import { env } from 'node:process';
import { GatewayIntentBits, Partials, ActivityType } from 'discord.js';
import { pino } from 'pino';
import { type GlobalInfo, type GuildInfo } from '../types/bot-types/swear.js';
import { BotClient, verifyConfig } from '../util/bot-client.js';

const logger = pino({ name: 'Swear Bot' });

const config = {
	admin: env.ADMIN ?? '',
	swear: env.SWEAR ?? '',
};

verifyConfig(config);

const swearClient = new BotClient<GlobalInfo, GuildInfo>(
	{
		intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
		partials: [Partials.Channel],
		presence: {
			activities: [{ name: env.SWEAR_STATUS ?? '', type: ActivityType.Playing }],
		},
	},
	'swear',
	logger,

	(logger) => {
		return {
			logger,
			admin: config.admin,
			swear: config.swear,
		};
	},
	() => {
		return {};
	},
);

await swearClient.login(env.SWEAR_TOKEN);
