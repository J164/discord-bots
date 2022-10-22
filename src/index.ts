import { env } from 'node:process';
import { ActivityType, GatewayIntentBits, Partials } from 'discord.js';
import { config } from 'dotenv';
import { PotatoClient } from './potato-client.js';

config();

const client = new PotatoClient(
	{
		intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
		partials: [Partials.Channel],
		presence: {
			activities: [
				{
					name: env.STATUS,
					type: ActivityType.Playing,
				},
			],
		},
	},
	{
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
	() => {
		return { queueManager: undefined };
	},
);

await client.login(env.TOKEN);
