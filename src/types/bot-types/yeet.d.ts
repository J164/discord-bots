import { type Logger } from 'pino';
import { type ChatCommand, type CommandType } from '../client.js';

/** Global bot info used to respond to interactions recieved by Yeet Bot */
type GlobalInfo = {
	readonly logger: Logger;
	readonly tenorKey: string;
};

/** Guild-specific info used to respond to interactions recieved by Yeet Bot */
type GuildInfo = Record<string, unknown>;

/** Shorthand for a ChatCommand with Yeet Bot global and guild info */
type YeetChatCommand<T extends CommandType> = ChatCommand<T, GlobalInfo, GuildInfo>;
