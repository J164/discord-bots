import { env } from 'node:process';
import { pino } from 'pino';
import { PotatoClient } from '../bot-clients/potato-client.js';

const potatoClient = new PotatoClient(
	{
		logger: pino({ name: 'Potato Bot' }),
		abstractKey: env.ABSTRACT_KEY ?? '',
		announcementChannel: env.ANNOUNCEMENT_CHANNEL ?? '',
		announcementTime: env.ANNOUNCEMENT_TIME ?? '',
		databaseName: env.DATABASE_NAME ?? '',
		gradeUpdateInterval: env.GRADE_UPDATE_INTERVAL ?? '',
		mongodbUrl: env.MONGODB_URL ?? '',
		spotifyToken: env.SPOTIFY_TOKEN ?? '',
		weatherKey: env.WEATHER_KEY ?? '',
		dropboxToken: env.DROPBOX_TOKEN ?? '',
	},
	env.POTATO_STATUS ?? '',
);

await potatoClient.login(env.POTATO_TOKEN);
