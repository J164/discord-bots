import type { AutocompleteInteraction, CacheType, ChatInputApplicationCommandData, ChatInputCommandInteraction, InteractionResponse } from 'discord.js';
import type { Logger } from 'pino';

/** Responds to a chat command with global scope */
type GlobalChatCommandResponseFunction<GlobalInfo> = (response: GlobalChatCommandResponse, globalInfo: GlobalInfo) => Promise<void>;

/** Responds to an autocomplete interaction with global scope */
type GlobalAutocompleteFunction<GlobalInfo> = (interaction: AutocompleteInteraction, globalInfo: GlobalInfo) => Promise<void>;

/** Responds to a chat command with guild scope */
type GuildChatCommandResponseFunction<GlobalInfo, GuildInfo> = (
	response: GuildChatCommandResponse,
	guildInfo: GuildInfo,
	globalInfo: GlobalInfo,
) => Promise<void>;

/** Responds to an autocomplete interaction with guild scope */
type GuildAutocompleteFunction<GlobalInfo, GuildInfo> = (interaction: AutocompleteInteraction, guildInfo: GuildInfo, globalInfo: GlobalInfo) => Promise<void>;

/** Interaction info for chat commands send by Discord */
type ChatCommandResponse<T extends CacheType> = Omit<InteractionResponse, 'interaction'> & {
	interaction: ChatInputCommandInteraction<T>;
};

/** Shorthand for a ChatCommandResponse with global scope */
type GlobalChatCommandResponse = ChatCommandResponse<CacheType>;

/** Shorhand for a ChatCommandResponse with guild scope */
type GuildChatCommandResponse = ChatCommandResponse<'cached'>;

/** Discord command types */
type CommandType = 'Global' | 'Guild';

/** Object that defines how the bot handles a Chat Command */
type ChatCommand<T extends CommandType, GlobalInfo, GuildInfo> = (T extends 'Global'
	? {
			readonly respond: GlobalChatCommandResponseFunction<GlobalInfo>;
			readonly autocomplete?: GlobalAutocompleteFunction<GlobalInfo>;
			readonly type: T;
	  }
	: {
			readonly respond: GuildChatCommandResponseFunction<GlobalInfo, GuildInfo>;
			readonly autocomplete?: GuildAutocompleteFunction<GlobalInfo, GuildInfo>;
			readonly type: T;
	  }) & {
	readonly data: ChatInputApplicationCommandData;
	readonly ephemeral?: boolean;
	readonly allowedUsers?: string[];
};

/** Essential config properties */
type BaseConfig = {
	readonly logger: Logger;
};

/** Essential global info properties */
type BaseGlobalInfo = {
	readonly logger: Logger;
};

/** Essential guild info properties */
type BaseGuildInfo = Record<string, unknown>;
