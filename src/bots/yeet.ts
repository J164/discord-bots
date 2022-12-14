import { env } from 'node:process';
import { GatewayIntentBits, Partials, ActivityType } from 'discord.js';
import { pino } from 'pino';
import { type GlobalInfo } from '../types/bot-types/yeet.js';
import { BotClient, verifyConfig } from '../util/bot-client.js';

const logger = pino({ name: 'Yeet Bot' });

const config = {
	tenorKey: env.TENOR_KEY ?? '',
};

verifyConfig(config);

const yeetClient = new BotClient<GlobalInfo>(
	{
		intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
		partials: [Partials.Channel],
		presence: {
			activities: [{ name: env.YEET_STATUS ?? '', type: ActivityType.Playing }],
		},
	},
	'yeet',
	logger,
	{
		tenorKey: config.tenorKey,
	},
);

await yeetClient.login(env.YEET_TOKEN);
