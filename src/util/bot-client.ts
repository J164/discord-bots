import { readdir } from 'node:fs/promises';
import { type AutocompleteInteraction, type CacheType, type ChatInputCommandInteraction, type ClientOptions, Client, InteractionType } from 'discord.js';
import { type Logger } from 'pino';
import { type BaseGlobalInfo, type BaseGuildInfo, type ChatCommand, type ChatCommandResponse, type CommandType } from '../types/client.js';
import { EmbedType, responseOptions } from './builders.js';

/**
 * Verifies all required config options have been defined
 * @param config The config to verify
 * @throws If any of the config options are absent
 */
export function verifyConfig(config: Record<string, string>) {
	const missingOptions = [];
	for (const [key, option] of Object.entries(config)) {
		if (!option) {
			missingOptions.push(key);
		}
	}

	if (missingOptions.length > 0) {
		throw new Error(`Missing the following environment variables: ${missingOptions.join(', ')}`);
	}
}

/** Class representing a client for a Discord bot */
export class BotClient<GlobalInfo extends BaseGlobalInfo, GuildInfo extends BaseGuildInfo> extends Client {
	private readonly _commands: Record<string, ChatCommand<CommandType, GlobalInfo, GuildInfo>>;
	private readonly _guildInfo: Record<string, GuildInfo | undefined>;

	public constructor(
		options: ClientOptions,
		botName: string,
		private readonly _logger: Logger,
		private readonly _getGlobalInfo: (logger: Logger) => GlobalInfo,
		private readonly _getDefaultGuildInfo: () => GuildInfo,
	) {
		super(options);

		this._commands = {};
		this._guildInfo = {};

		this.once('ready', async () => {
			this._logger.info({}, 'Login Successful');

			const commands = await readdir(`./commands/${botName}`);
			await Promise.all(
				commands.map(async (file) => {
					if (!file.endsWith('.js')) {
						return;
					}

					const { command } = (await import(`../commands/${botName}/${file}`)) as { command: ChatCommand<CommandType, GlobalInfo, GuildInfo> };
					this._commands[command.data.name] = command;
				}),
			);

			this.on('interactionCreate', (interaction) => {
				switch (interaction.type) {
					case InteractionType.ApplicationCommandAutocomplete: {
						void this._autocompleteChatCommand(interaction);
						break;
					}

					case InteractionType.ApplicationCommand: {
						if (interaction.isChatInputCommand()) {
							void this._chatCommand(interaction);
							break;
						}

						break;
					}

					default: {
						break;
					}
				}
			});
		});
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

		const interactionResponse = (await interaction.deferReply({ ephemeral: command.ephemeral ?? false })) as ChatCommandResponse<CacheType>;

		this._logger.info({ options: interaction.options.data }, `(${interaction.id}) /${interaction.commandName}`);

		const globalData = this._getGlobalInfo(
			this._logger.child({
				id: interaction.id,
				commandName: interaction.commandName,
				options: interaction.options,
			}),
		);

		if (command.type === 'Guild') {
			if (!interaction.inCachedGuild()) {
				await interaction.editReply(responseOptions(EmbedType.Error, 'This is a server only command!'));
				return;
			}

			try {
				await command.respond(
					interactionResponse as ChatCommandResponse<'cached'>,
					(this._guildInfo[interaction.guildId] ??= this._getDefaultGuildInfo()),
					globalData,
				);
			} catch (error) {
				await interaction.editReply(responseOptions(EmbedType.Error, 'Something went wrong'));
				this._logger.error(error, `Chat Command Interaction #${interaction.id} threw an error`);
			}

			return;
		}

		try {
			await command.respond(interactionResponse, globalData);
		} catch (error) {
			await interaction.editReply(responseOptions(EmbedType.Error, 'Something went wrong'));
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

		const globalData = this._getGlobalInfo(
			this._logger.child({
				id: interaction.id,
				commandName: interaction.commandName,
				options: interaction.options,
			}),
		);

		if (command.type === 'Guild') {
			if (!interaction.inCachedGuild()) {
				await interaction.respond([]);
				return;
			}

			try {
				await command.autocomplete(interaction, (this._guildInfo[interaction.guildId] ??= this._getDefaultGuildInfo()), globalData);
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
