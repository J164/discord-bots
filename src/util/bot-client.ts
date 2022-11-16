import type { AutocompleteInteraction, CacheType, ChatInputCommandInteraction, ClientOptions } from 'discord.js';
import { Client, InteractionType } from 'discord.js';
import type { Logger } from 'pino';
import type { BaseConfig, BaseGlobalInfo, BaseGuildInfo, ChatCommand, ChatCommandResponse, CommandType } from '../types/client.js';
import { EmbedType, responseOptions } from './builders.js';

/** Class representing a client for a Discord bot */
export abstract class BotClient<GlobalInfo extends BaseGlobalInfo, GuildInfo extends BaseGuildInfo, Config extends BaseConfig> extends Client {
	private readonly _commands: Record<string, ChatCommand<CommandType, GlobalInfo, GuildInfo>>;
	private readonly _guildInfo: Record<string, GuildInfo | undefined>;

	public constructor(options: ClientOptions, protected readonly config: Config) {
		super(options);

		const missingOptions = [];
		for (const [key, option] of Object.entries(this.config)) {
			if (!option) {
				missingOptions.push(key);
			}
		}

		if (missingOptions.length > 0) {
			throw new Error(`Missing the following environment variables: ${missingOptions.join(', ')}`);
		}

		this._commands = {};
		this._guildInfo = {};
	}

	/**
	 * Imports a command from the specified file
	 * @param comamndPath The path to import the command from
	 */
	protected async importCommand(comamndPath: string) {
		const { command } = (await import(comamndPath)) as { command: ChatCommand<CommandType, GlobalInfo, GuildInfo> };
		this._commands[command.data.name] = command;
	}

	/** Subscribes a listener for the ready event */
	protected subscribeReadyListener(): void {
		this.once('ready', async () => {
			await this.startupTasks();

			this.config.logger.info({}, 'Login Successful');
			this._subscribeInteractionListener();
		});
	}

	/** Executes all of the startup tasks necessary for the bot */
	protected abstract startupTasks(): Promise<void>;

	/**
	 * Generates global bot info for responding to interactions
	 * @param logger A logger child for the interaction being responded to
	 */
	protected abstract getGlobalInfo(logger: Logger): GlobalInfo;

	/**
	 * Generates the default guild info for a new guild
	 * @returns The default guild info
	 */
	protected abstract getDefaultGuildInfo(): GuildInfo;

	/** Subscribes a listener for the interactionCreate event */
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
	 * Handles a ChatInputCommandInteraction
	 * @param interaction The ChatInputCommandInteraction to handle
	 * @returns A Promise that resolves when the interaction has been handled
	 */
	private async _chatCommand(interaction: ChatInputCommandInteraction): Promise<void> {
		const command = this._commands[interaction.commandName];

		if (!command) {
			this.config.logger.error({}, `Chat Command named "${interaction.commandName}" not found!`);
			await interaction.reply(responseOptions(EmbedType.Error, `Command ${interaction.commandName} not found!`));
			return;
		}

		if (command.allowedUsers && !command.allowedUsers.includes(interaction.user.id)) {
			await interaction.reply(responseOptions(EmbedType.Error, 'You are not registered to use this command!'));
			return;
		}

		const interactionResponse = (await interaction.deferReply({ ephemeral: command.ephemeral ?? false })) as ChatCommandResponse<CacheType>;

		this.config.logger.info({ options: interaction.options.data }, `(${interaction.id}) /${interaction.commandName}`);

		const globalData = this.getGlobalInfo(
			this.config.logger.child({
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
					(this._guildInfo[interaction.guildId] ??= this.getDefaultGuildInfo()),
					globalData,
				);
			} catch (error) {
				this.config.logger.error(error, `Chat Command Interaction #${interaction.id} threw an error`);
			}

			return;
		}

		try {
			await command.respond(interactionResponse, globalData);
		} catch (error) {
			this.config.logger.error(error, `Chat Command Interaction #${interaction.id} threw an error`);
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
			this.config.logger.error({}, `Could not find Autocomplete functon for command named "${interaction.commandName}"`);
			await interaction.respond([]);
			return;
		}

		if (command.allowedUsers && !command.allowedUsers.includes(interaction.user.id)) {
			await interaction.respond([]);
			return;
		}

		const globalData = this.getGlobalInfo(
			this.config.logger.child({
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
				await command.autocomplete(interaction, (this._guildInfo[interaction.guildId] ??= this.getDefaultGuildInfo()), globalData);
			} catch (error) {
				this.config.logger.info({ options: interaction.options.data }, `(${interaction.id}) /${interaction.commandName}`);
				this.config.logger.error(error, `Chat Command Autocomplete #${interaction.id} threw an error`);
			}

			return;
		}

		try {
			await command.autocomplete(interaction, globalData);
		} catch (error) {
			this.config.logger.info({ options: interaction.options.data }, `(${interaction.id}) /${interaction.commandName}`);
			this.config.logger.error(error, `Chat Command Autocomplete #${interaction.id} threw an error`);
		}
	}
}
