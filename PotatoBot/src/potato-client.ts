import { readdir } from 'node:fs/promises';
import type { ClientOptions, TextChannel } from 'discord.js';
import { MongoClient } from 'mongodb';
import cron from 'node-cron';
import type { Logger } from 'pino';
import { BotClient } from './bot-client.js';
import { getDailyReport } from './modules/daily-report.js';
import { gradeReport } from './modules/grade-report.js';
import { getWeatherReport } from './modules/weather-report.js';
import type { Config, GlobalInfo, GuildInfo } from './types/potato.js';

/** Class representing the client for PotatoBot */
export class PotatoClient extends BotClient<GlobalInfo, GuildInfo, Config> {
	private readonly _databaseClient: MongoClient;
	private _weather?: WeatherResponse;

	public constructor(options: ClientOptions, config: Config, defaultGuildInfo: () => GuildInfo) {
		super(options, config, defaultGuildInfo);
		this._databaseClient = new MongoClient(this.config.mongodbUrl);
		this.subscribeReadyListener();
	}

	protected async startupTasks(): Promise<void> {
		const weatherTask = cron.schedule('0 0 * * *', async (date) => {
			try {
				this._weather = await getWeatherReport(date, this.config.weatherKey);
			} catch (error) {
				this.config.logger.error(error, 'Weather Report threw an error');
				weatherTask.stop();
			}
		});

		const announcementTask = cron.schedule(this.config.announcementTime, async (date) => {
			try {
				const channel = (await this.channels.fetch(this.config.announcementChannel)) as TextChannel;
				await channel.send(await getDailyReport(date, this.config.abstractKey, this._databaseClient.db(this.config.databaseName), this._weather));
			} catch (error) {
				this.config.logger.error(error, 'Daily Announcement threw an error');
				announcementTask.stop();
			}
		});

		const gradeTask = cron.schedule(this.config.gradeUpdateInterval, async () => {
			try {
				const report = await gradeReport(this._databaseClient.db(this.config.databaseName), this.config.ircToken, gradeTask);
				if (!report) {
					return;
				}

				const admin = await this.users.fetch(this.config.admin);
				const dm = await admin.createDM();
				await dm.send({
					embeds: [report],
				});
			} catch (error) {
				this.config.logger.error(error, 'Grade Monitor threw an error');
				gradeTask.stop();
			}
		});

		await Promise.all([
			(async () => {
				await this._databaseClient.connect();
			})(),
			(async () => {
				this._weather = await getWeatherReport(new Date(), this.config.weatherKey);
			})(),
			(async () => {
				const commands = await readdir('./dist/commands');
				return Promise.all(
					commands.map((file) => {
						if (!file.endsWith('.js')) {
							return;
						}

						return this.importCommand(`./commands/${file}`);
					}),
				);
			})(),
		]);
	}

	protected getGlobalInfo(logger: Logger): GlobalInfo {
		return {
			logger,
			database: this._databaseClient.db(this.config.databaseName),
			downloadDirectory: this.config.downloadDirectory,
			spotifyToken: this.config.spotifyToken,
			ircToken: this.config.ircToken,
			weather: this._weather,
		};
	}
}
