import { readdir } from 'node:fs/promises';
import { type TextChannel, ActivityType, GatewayIntentBits, Partials } from 'discord.js';
import { MongoClient } from 'mongodb';
import cron from 'node-cron';
import { type Logger } from 'pino';
import { BotClient } from '../util/bot-client.js';
import { type Config, type GlobalInfo, type GuildInfo } from '../types/bot-types/potato.js';
import { getDailyReport } from '../modules/daily-report.js';
import { gradeReport } from '../modules/grade-report.js';
import { getWeatherReport } from '../modules/weather-report.js';

/** Class representing the client for Potato Bot */
export class PotatoClient extends BotClient<GlobalInfo, GuildInfo, Config> {
	private readonly _databaseClient: MongoClient;
	private _weather: WeatherResponse | undefined;

	public constructor(config: Config, status: string) {
		super(
			{
				intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
				partials: [Partials.Channel],
				presence: {
					activities: [
						{
							name: status,
							type: ActivityType.Playing,
						},
					],
				},
			},
			config,
		);
		this._databaseClient = new MongoClient(this.config.mongodbUrl);
		this.subscribeReadyListener();
	}

	protected async startupTasks(): Promise<void> {
		cron.schedule('0 0 * * *', async () => {
			try {
				this._weather = await getWeatherReport(this.config.weatherKey);
			} catch (error) {
				this.config.logger.error(error, 'Weather Report threw an error');
			}
		});

		cron.schedule(this.config.announcementTime, async () => {
			try {
				const channel = (await this.channels.fetch(this.config.announcementChannel)) as TextChannel;
				await channel.send(await getDailyReport(this.config.abstractKey, this._databaseClient.db(this.config.databaseName), this._weather));
			} catch (error) {
				this.config.logger.error(error, 'Daily Announcement threw an error');
			}
		});

		cron.schedule(this.config.gradeUpdateInterval, async () => {
			try {
				await gradeReport(this._databaseClient.db(this.config.databaseName), this.users);
			} catch (error) {
				this.config.logger.error(error, 'Grade Monitor threw an error');
			}
		});

		await Promise.all([
			(async () => {
				await this._databaseClient.connect();
			})(),
			(async () => {
				this._weather = await getWeatherReport(this.config.weatherKey);
			})(),
			(async () => {
				const commands = await readdir('./commands/potato');
				return Promise.all(
					commands.map((file) => {
						if (!file.endsWith('.js')) {
							return;
						}

						return this.importCommand(`../commands/potato/${file}`);
					}),
				);
			})(),
		]);
	}

	protected getGlobalInfo(logger: Logger): GlobalInfo {
		return {
			logger,
			database: this._databaseClient.db(this.config.databaseName),
			spotifyToken: this.config.spotifyToken,
			dropboxToken: this.config.dropboxToken,
			weather: this._weather,
		};
	}

	protected getDefaultGuildInfo(): GuildInfo {
		return {};
	}
}
