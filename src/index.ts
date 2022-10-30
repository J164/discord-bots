import { env } from 'node:process';
import { config } from 'dotenv';
import { pino } from 'pino';
import { PotatoClient } from './bot-clients/potato-client.js';
import { CrystalClient } from './bot-clients/crystal-client.js';
import { SwearClient } from './bot-clients/swear-client.js';
import { YeetClient } from './bot-clients/yeet-client.js';

config();

const logger = pino();

const crystalClient = new CrystalClient(
	{
		logger: logger.child({ name: 'Crystal Bot' }),
		ostDirectory: env.OST_DIRECTORY ?? '',
	},
	env.CRYSTAL_STATUS,
);

const potatoClient = new PotatoClient(
	{
		logger: logger.child({ name: 'Potato Bot' }),
		abstractKey: env.ABSTRACT_KEY ?? '',
		admin: env.ADMIN ?? '',
		announcementChannel: env.ANNOUNCEMENT_CHANNEL ?? '',
		announcementTime: env.ANNOUNCEMENT_TIME ?? '',
		databaseName: env.DATABASE_NAME ?? '',
		downloadDirectory: env.DOWNLOAD_DIRECTORY ?? '',
		gradeUpdateInterval: env.GRADE_UPDATE_INTERVAL ?? '',
		ircToken: env.IRC_TOKEN ?? '',
		mongodbUrl: env.MONGODB_URL ?? '',
		spotifyToken: env.SPOTIFY_TOKEN ?? '',
		weatherKey: env.WEATHER_KEY ?? '',
	},
	env.POTATO_STATUS,
);

const swearClient = new SwearClient(
	{
		logger: logger.child({ name: 'Swear Bot' }),
		admin: env.ADMIN ?? '',
		swear: env.SWEAR ?? '',
		songDirectory: env.SONG_DIRECTORY ?? '',
	},
	env.SWEAR_STATUS,
);

const yeetClient = new YeetClient(
	{
		logger: logger.child({ name: 'Crystal Bot' }),
		tenorKey: env.TENOR_KEY ?? '',
	},
	env.YEET_STATUS,
);

await Promise.all([
	crystalClient.login(env.CRYSTAL_TOKEN),
	potatoClient.login(env.POTATO_TOKEN),
	swearClient.login(env.SWEAR_TOKEN),
	yeetClient.login(env.YEET_TOKEN),
]);
