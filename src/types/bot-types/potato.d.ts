import { type Db } from 'mongodb';
import { type QueueManager } from '../../voice/queue-manager.js';
import { type ChatCommand, type CommandType } from '../client.js';

/** Global bot info used to respond to interactions recieved by Potato Bot */
type GlobalInfo = {
	readonly database: Db;
	readonly spotifyToken: string;
};

/** Guild-specific info used to respond to interactions recieved by Potato Bot */
type GuildInfo = {
	queueManager?: QueueManager;
};

/** Shorthand for a ChatCommand with Potato Bot global and guild info */
type PotatoChatCommand<T extends CommandType> = ChatCommand<T, GlobalInfo, GuildInfo>;
