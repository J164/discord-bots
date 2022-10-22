import type { CacheType, InteractionResponse, ChatInputCommandInteraction, AutocompleteInteraction, ChatInputApplicationCommandData } from 'discord.js';
import type { Db } from 'mongodb';
import type { Logger } from 'pino';
import type { QueueManager } from '../voice/queue-manager.js';

type Config = {
	readonly mongodbUrl: string;
	readonly announcementTime: string;
	readonly announcementChannel: string;
	readonly databaseName: string;
	readonly gradeUpdateInterval: string;
	readonly admin: string;
	readonly weatherKey: string;
	readonly abstractKey: string;
	readonly downloadDirectory: string;
	readonly spotifyToken: string;
	readonly ircToken: string;
};

/** Data stored by the bot for use in commands regardless of guild */
type GlobalInfo = {
	readonly database: Db;
	readonly logger: Logger;
	readonly downloadDirectory: string;
	readonly spotifyToken: string;
	readonly ircToken: string;
	readonly weather?: WeatherResponse;
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

type GlobalChatCommandResponse = ChatCommandResponse<CacheType>;
type GuildChatCommandResponse = ChatCommandResponse<'cached'>;

// Response Functions

/** Chat command response function that doesn't require data associated with a specific guild */
type GlobalResponseFunction = (response: GlobalChatCommandResponse, globalInfo: GlobalInfo) => Promise<void>;

/** Autocomplete response function that doesn't require data associated with a specific guild */
type GlobalAutocompleteFunction = (interaction: AutocompleteInteraction, globalInfo: GlobalInfo) => Promise<void>;

/** Chat command response function that requires data associated with a specific guild */
type GuildResponseFunction = (response: GuildChatCommandResponse, guildInfo: GuildInfo, globalInfo: GlobalInfo) => Promise<void>;

/** Autocomplete response function that requires data associated with a specific guild */
type GuildAutocompleteFunction = (interaction: AutocompleteInteraction, guildInfo: GuildInfo, globalInfo: GlobalInfo) => Promise<void>;

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
