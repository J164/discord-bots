import type {
	CacheType,
	InteractionResponse,
	ChatInputCommandInteraction,
	AutocompleteInteraction,
	InteractionReplyOptions,
	ApplicationCommandOptionChoiceData,
	ChatInputApplicationCommandData,
} from 'discord.js';
import type { Db } from 'mongodb';
import type { QueueManager } from '../voice/queue-manager.js';

/** Data stored by the bot for use in commands regardless of guild */
type GlobalInfo = {
	readonly database: Db;
	readonly weather?: WeatherResponse;
	readonly spotifyToken: string;
	readonly announcementChannel: string;
	readonly downloadDirectory: string;
	readonly ircToken: string;
};

/** Data stored by the bot for use in commands associated with a specific guild */
type GuildInfo = {
	queueManager: QueueManager | undefined;
};

// Data Passed to Response Functions

/** Interaction info for chat commands send by Discord */
type ChatCommandResponse<T extends CacheType> = Omit<InteractionResponse, 'interaction'> & {
	interaction: ChatInputCommandInteraction<T>;
};

/** Info sent to chat command response functions not associated with a specific guild */
type GlobalChatCommandInfo<T extends 'Guild' | 'Global'> = GlobalInfo & {
	readonly response: ChatCommandResponse<T extends 'Guild' ? 'cached' : CacheType>;
};

/** Info sent to autocomplete response function not associated with a specific guild */
type GlobalAutocompleteInfo = GlobalInfo & {
	readonly interaction: AutocompleteInteraction;
};

/** Info sent to chat command response functions associated with a specific guild */
type GuildChatCommandInfo = GuildInfo;

/** Info send to autocomplete response functions associated with a specific guild */
type GuildAutocompleteInfo = GuildInfo;

// Response Functions

/** Chat command response function that doesn't require data associated with a specific guild */
type GlobalResponseFunction = (globalInfo: GlobalChatCommandInfo<'Global'>) => Promise<InteractionReplyOptions | void> | InteractionReplyOptions | void;

/** Autocomplete response function that doesn't require data associated with a specific guild */
type GlobalAutocompleteFunction = (globalInfo: GlobalAutocompleteInfo) => Promise<ApplicationCommandOptionChoiceData[]> | ApplicationCommandOptionChoiceData[];

/** Chat command response function that requires data associated with a specific guild */
type GuildResponseFunction = (
	globalInfo: GlobalChatCommandInfo<'Guild'>,
	guildInfo: GuildChatCommandInfo,
) => Promise<InteractionReplyOptions | void> | InteractionReplyOptions | void;

/** Autocomplete response function that requires data associated with a specific guild */
type GuildAutocompleteFunction = (
	globalInfo: GlobalAutocompleteInfo,
	guildInfo: GuildAutocompleteInfo,
) => Promise<ApplicationCommandOptionChoiceData[]> | ApplicationCommandOptionChoiceData[];

// Command Data Interfaces

/** Object that defines how the bot handles a Chat Command */
type ChatCommand<T extends 'Global' | 'Guild'> = (T extends 'Global'
	? {
			readonly respond: GlobalResponseFunction;
			readonly autocomplete?: GlobalAutocompleteFunction;
			readonly type: T;
	  }
	: {
			readonly respond: GuildResponseFunction;
			readonly autocomplete?: GuildAutocompleteFunction;
			readonly type: T;
	  }) & {
	readonly data: ChatInputApplicationCommandData;
	readonly ephemeral?: boolean;
	readonly allowedUsers?: string[];
};
