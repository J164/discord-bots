import { env } from 'node:process';
import { MongoClient } from 'mongodb';
import { pino } from 'pino';
import cron from 'node-cron';
import { ActivityType, GatewayIntentBits, Partials, type TextChannel } from 'discord.js';
import { type GlobalInfo } from '../types/bot-types/potato.js';
import { BotClient, verifyConfig } from '../util/bot-client.js';
import { getDailyReport } from '../modules/daily-report.js';
import { gradeReport } from '../modules/grade-report.js';

const logger = pino({ name: 'Potato Bot' });
const databaseClient = new MongoClient(env.MONGODB_URL ?? '');

await databaseClient.connect();

const config = {
	abstractKey: env.ABSTRACT_KEY ?? '',
	announcementChannel: env.ANNOUNCEMENT_CHANNEL ?? '',
	announcementTime: env.ANNOUNCEMENT_TIME ?? '',
	databaseName: env.DATABASE_NAME ?? '',
	gradeUpdateInterval: env.GRADE_UPDATE_INTERVAL ?? '',
	mongodbUrl: env.MONGODB_URL ?? '',
	spotifyToken: env.SPOTIFY_TOKEN ?? '',
	weatherKey: env.WEATHER_KEY ?? '',
	ircDebugChannel: env.IRC_DEBUG_CHANNEL ?? '',
};

verifyConfig(config);

const potatoClient = new BotClient<GlobalInfo>(
	{
		intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
		partials: [Partials.Channel],
		presence: {
			activities: [
				{
					name: env.POTATO_STATUS ?? '',
					type: ActivityType.Playing,
				},
			],
		},
	},
	'potato',
	logger,
	{
		database: databaseClient.db(config.databaseName),
		spotifyToken: config.spotifyToken,
	},
);

cron.schedule(config.announcementTime, async () => {
	try {
		const channel = (await potatoClient.channels.fetch(config.announcementChannel)) as TextChannel;
		await channel.send(await getDailyReport(config.abstractKey, databaseClient.db(config.databaseName), config.weatherKey));
	} catch (error) {
		logger.error(error, 'Daily Announcement threw an error');
	}
});

cron.schedule(config.gradeUpdateInterval, async () => {
	try {
		await gradeReport(databaseClient.db(config.databaseName), potatoClient.users, (await potatoClient.channels.fetch(config.ircDebugChannel)) as TextChannel);
	} catch (error) {
		logger.error(error, 'Grade Monitor threw an error');
	}
});

await potatoClient.login(env.POTATO_TOKEN);
