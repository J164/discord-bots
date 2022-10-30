import type { Logger } from 'pino';
import type { Player } from '../../voice/player.js';
import type { ChatCommand, CommandType } from '../client.js';

/** Config options for Potato Bot */
type Config = {
	readonly logger: Logger;
	readonly admin: string;
	readonly swear: string;
	readonly songDirectory: string;
};

/** Global bot info used to respond to interactions recieved by Potato Bot */
type GlobalInfo = {
	readonly logger: Logger;
	readonly songDirectory: string;
	readonly admin: string;
	readonly swear: string;
};

/** Guild-specific info used to respond to interactions recieved by Potato Bot */
type GuildInfo = { player?: Player };

/** Shorthand for a ChatCommand with Yeet Bot global and guild info */
type SwearChatCommand<T extends CommandType> = ChatCommand<T, GlobalInfo, GuildInfo>;
