import { env } from 'node:process';
import { MongoClient } from 'mongodb';
import { pino } from 'pino';
import cron from 'node-cron';
import { ActivityType, GatewayIntentBits, Partials, type TextChannel } from 'discord.js';
import { getWeatherReport } from '../modules/weather-report.js';
import { type GlobalInfo, type GuildInfo } from '../types/bot-types/potato.js';
import { BotClient, verifyConfig } from '../util/bot-client.js';
import { getDailyReport } from '../modules/daily-report.js';
import { gradeReport } from '../modules/grade-report.js';

const logger = pino({ name: 'Potato Bot' });
const databaseClient = new MongoClient(env.MONGODB_URL ?? '');
let weather = await getWeatherReport(env.WEATHER_KEY ?? '');

const config = {
	abstractKey: env.ABSTRACT_KEY ?? '',
	announcementChannel: env.ANNOUNCEMENT_CHANNEL ?? '',
	announcementTime: env.ANNOUNCEMENT_TIME ?? '',
	databaseName: env.DATABASE_NAME ?? '',
	gradeUpdateInterval: env.GRADE_UPDATE_INTERVAL ?? '',
	mongodbUrl: env.MONGODB_URL ?? '',
	spotifyToken: env.SPOTIFY_TOKEN ?? '',
	weatherKey: env.WEATHER_KEY ?? '',
	dropboxToken: env.DROPBOX_TOKEN ?? '',
	dropboxBasePath: env.DROPBOX_BASE_PATH ?? '',
};

verifyConfig(config);

const potatoClient = new BotClient<GlobalInfo, GuildInfo>(
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
	(logger) => {
		return {
			logger,
			database: databaseClient.db(config.databaseName),
			spotifyToken: config.spotifyToken,
			dropboxToken: config.dropboxToken,
			dropboxBasePath: config.dropboxBasePath,
			weather,
		};
	},
	() => {
		return {};
	},
);

await databaseClient.connect();

cron.schedule('0 0 * * *', async () => {
	try {
		weather = await getWeatherReport(config.weatherKey);
	} catch (error) {
		logger.error(error, 'Weather Report threw an error');
	}
});

cron.schedule(config.announcementTime, async () => {
	try {
		const channel = (await potatoClient.channels.fetch(config.announcementChannel)) as TextChannel;
		await channel.send(await getDailyReport(config.abstractKey, databaseClient.db(config.databaseName), weather));
	} catch (error) {
		logger.error(error, 'Daily Announcement threw an error');
	}
});

cron.schedule(config.gradeUpdateInterval, async () => {
	try {
		await gradeReport(databaseClient.db(config.databaseName), potatoClient.users);
	} catch (error) {
		logger.error(error, 'Grade Monitor threw an error');
	}
});

await potatoClient.login(env.POTATO_TOKEN);
