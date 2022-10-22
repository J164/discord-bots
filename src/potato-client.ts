import { readdir } from 'node:fs/promises';
import type { ClientOptions, ChatInputCommandInteraction, CacheType, AutocompleteInteraction, TextChannel } from 'discord.js';
import { Client, InteractionType } from 'discord.js';
import { MongoClient } from 'mongodb';
import cron from 'node-cron';
import { pino } from 'pino';
import type { Logger } from 'pino';
import type { ChatCommand, GuildInfo, ChatCommandResponse, Config } from './types/commands.js';
import { EmbedType, responseOptions } from './util/builders.js';
import { getDailyReport } from './modules/daily-report.js';
import { gradeReport } from './modules/grade-report.js';
import { getWeatherReport } from './modules/weather-report.js';

/** Class representing the client for PotatoBot */
export class PotatoClient extends Client {
	private readonly _commands: Record<string, ChatCommand<'Global' | 'Guild'>>;
	private readonly _guildInfo: Record<string, GuildInfo | undefined>;
	private readonly _databaseClient: MongoClient;
	private readonly _logger: Logger;
	private _weather?: WeatherResponse;

	public constructor(options: ClientOptions, private readonly _config: Config, private readonly _defaultGuildInfo: () => GuildInfo) {
		super(options);

		const missingOptions = [];
		for (const [key, option] of Object.entries(this._config)) {
			if (!option) {
				missingOptions.push(key);
			}
		}

		if (missingOptions.length > 0) {
			throw new Error(`Missing the following environment variables: ${missingOptions.join(', ')}`);
		}

		this._commands = {};
		this._guildInfo = {};

		this._databaseClient = new MongoClient(this._config.mongodbUrl);

		this._logger = pino();

		this.once('ready', async () => {
			await Promise.all([
				(async () => {
					await this._databaseClient.connect();
				})(),
				(async () => {
					this._weather = await getWeatherReport(new Date(), this._config.weatherKey);
				})(),
				(async () => {
					const commands = await readdir('./dist/commands');
					return Promise.all(
						commands.map((file) => {
							if (!file.endsWith('.js')) {
								return;
							}

							return this._importCommand(`./commands/${file}`);
						}),
					);
				})(),
			]);

			this._logger.info({}, 'Login Successful');
			this._subscribeInteractionListener();

			const weatherTask = cron.schedule('0 0 * * *', async (date) => {
				try {
					this._weather = await getWeatherReport(date, this._config.weatherKey);
				} catch (error) {
					this._logger.error(error, 'Weather Report threw an error');
					weatherTask.stop();
				}
			});

			const announcementTask = cron.schedule(this._config.announcementTime, async (date) => {
				try {
					await ((await this.channels.fetch(this._config.announcementChannel)) as TextChannel).send(
						await getDailyReport(date, this._config.abstractKey, this._databaseClient.db(this._config.databaseName), this._weather),
					);
				} catch (error) {
					this._logger.error(error, 'Daily Announcement threw an error');
					announcementTask.stop();
				}
			});

			const gradeTask = cron.schedule(this._config.gradeUpdateInterval, async () => {
				try {
					const report = await gradeReport(this._databaseClient.db(this._config.databaseName), this._config.ircToken, gradeTask);
					if (!report) return;
					const admin = await this.users.fetch(this._config.admin);
					const dm = await admin.createDM();
					await dm.send({
						embeds: [report],
					});
				} catch (error) {
					this._logger.error(error, 'Grade Monitor threw an error');
					gradeTask.stop();
				}
			});
		});
	}

	/**
	 * Subscribes a listener for the interactionCreate event
	 */
	private _subscribeInteractionListener(): void {
		this.on('interactionCreate', (interaction) => {
			switch (interaction.type) {
				case InteractionType.ApplicationCommandAutocomplete:
					void this._autocompleteChatCommand(interaction);
					break;
				case InteractionType.ApplicationCommand:
					if (interaction.isChatInputCommand()) {
						void this._chatCommand(interaction);
						break;
					}

					break;
				default:
					break;
			}
		});
	}

	/**
	 * Imports a command from the specified file
	 * @param comamndPath The path to import the command from
	 */
	private async _importCommand(comamndPath: string) {
		const { command } = (await import(comamndPath)) as { command: ChatCommand<'Global' | 'Guild'> };
		this._commands[command.data.name] = command;
	}

	/**
	 * Handles a ChatInputCommandInteraction
	 * @param interaction The ChatInputCommandInteraction to handle
	 * @returns A Promise that resolves when the interaction has been handled
	 */
	private async _chatCommand(interaction: ChatInputCommandInteraction): Promise<void> {
		const command = this._commands[interaction.commandName];

		if (!command) {
			this._logger.error({}, `Chat Command named "${interaction.commandName}" not found!`);
			await interaction.reply(responseOptions(EmbedType.Error, `Command ${interaction.commandName} not found!`));
			return;
		}

		if (command.allowedUsers && !command.allowedUsers.includes(interaction.user.id)) {
			await interaction.reply(responseOptions(EmbedType.Error, 'You are not registered to use this command!'));
			return;
		}

		const interactionResponse = (await interaction.deferReply({ ephemeral: command.ephemeral })) as ChatCommandResponse<CacheType>;

		this._logger.info({ options: interaction.options.data }, `(${interaction.id}) /${interaction.commandName}`);

		const globalData = {
			database: this._databaseClient.db(this._config.databaseName),
			logger: this._logger.child({
				commandId: interaction.id,
				commandName: interaction.commandName,
				options: interaction.options,
			}),
			downloadDirectory: this._config.downloadDirectory,
			spotifyToken: this._config.spotifyToken,
			ircToken: this._config.ircToken,
			weather: this._weather,
		};

		if (command.type === 'Guild') {
			if (!interaction.inCachedGuild()) {
				await interaction.editReply(responseOptions(EmbedType.Error, 'This is a server only command!'));
				return;
			}

			try {
				await command.respond(
					interactionResponse as ChatCommandResponse<'cached'>,
					(this._guildInfo[interaction.guildId] ??= this._defaultGuildInfo()),
					globalData,
				);
			} catch (error) {
				this._logger.error(error, `Chat Command Interaction #${interaction.id} threw an error`);
			}

			return;
		}

		try {
			await command.respond(interactionResponse, globalData);
		} catch (error) {
			this._logger.error(error, `Chat Command Interaction #${interaction.id} threw an error`);
		}
	}

	/**
	 * Handles an AutocompleteInteraction
	 * @param interaction The AutocompleteInteraction to handle
	 * @returns A Promise that resolves when the interaction has been handled
	 */
	private async _autocompleteChatCommand(interaction: AutocompleteInteraction): Promise<void> {
		const command = this._commands[interaction.commandName];

		if (!command?.autocomplete) {
			this._logger.error({}, `Could not find Autocomplete functon for command named "${interaction.commandName}"`);
			await interaction.respond([]);
			return;
		}

		if (command.allowedUsers && !command.allowedUsers.includes(interaction.user.id)) {
			await interaction.respond([]);
			return;
		}

		const globalData = {
			database: this._databaseClient.db(this._config.databaseName),
			logger: this._logger.child({
				id: interaction.id,
				commandName: interaction.commandName,
				options: interaction.options,
			}),
			downloadDirectory: this._config.downloadDirectory,
			spotifyToken: this._config.spotifyToken,
			ircToken: this._config.ircToken,
			weather: this._weather,
		};

		if (command.type === 'Guild') {
			if (!interaction.inCachedGuild()) {
				await interaction.respond([]);
				return;
			}

			try {
				await command.autocomplete(interaction, (this._guildInfo[interaction.guildId] ??= this._defaultGuildInfo()), globalData);
			} catch (error) {
				this._logger.info({ options: interaction.options.data }, `(${interaction.id}) /${interaction.commandName}`);
				this._logger.error(error, `Chat Command Autocomplete #${interaction.id} threw an error`);
			}

			return;
		}

		try {
			await command.autocomplete(interaction, globalData);
		} catch (error) {
			this._logger.info({ options: interaction.options.data }, `(${interaction.id}) /${interaction.commandName}`);
			this._logger.error(error, `Chat Command Autocomplete #${interaction.id} threw an error`);
		}
	}
}
