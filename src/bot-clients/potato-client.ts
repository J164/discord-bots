import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TextChannel } from 'discord.js';
import { ActivityType, GatewayIntentBits, Partials } from 'discord.js';
import { MongoClient } from 'mongodb';
import cron from 'node-cron';
import type { Logger } from 'pino';
import { BotClient } from '../util/bot-client.js';
import type { Config, GlobalInfo, GuildInfo } from '../types/bot-types/potato.js';
import { getDailyReport } from '../modules/daily-report.js';
import { gradeReport } from '../modules/grade-report.js';
import { getWeatherReport } from '../modules/weather-report.js';

const COMMAND_DIR = `${path.dirname(fileURLToPath(import.meta.url))}/../commands/potato`;

/** Class representing the client for Potato Bot */
export class PotatoClient extends BotClient<GlobalInfo, GuildInfo, Config> {
	private readonly _databaseClient: MongoClient;
	private _weather?: WeatherResponse;

	public constructor(config: Config, status?: string) {
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
		const weatherTask = cron.schedule('0 0 * * *', async () => {
			try {
				this._weather = await getWeatherReport(this.config.weatherKey);
			} catch (error) {
				this.config.logger.error(error, 'Weather Report threw an error');
				weatherTask.stop();
			}
		});

		const announcementTask = cron.schedule(this.config.announcementTime, async () => {
			try {
				const channel = (await this.channels.fetch(this.config.announcementChannel)) as TextChannel;
				await channel.send(await getDailyReport(this.config.abstractKey, this._databaseClient.db(this.config.databaseName), this._weather));
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
				this._weather = await getWeatherReport(this.config.weatherKey);
			})(),
			(async () => {
				const commands = await readdir(COMMAND_DIR);
				return Promise.all(
					commands.map((file) => {
						if (!file.endsWith('.js')) {
							return;
						}

						return this.importCommand(`./commands/potato/${file}`);
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

	protected getDefaultGuildInfo(): GuildInfo {
		return {};
	}
}
