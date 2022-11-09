import type { Db } from 'mongodb';
import type { Logger } from 'pino';
import type { QueueManager } from '../../voice/queue-manager.js';
import type { ChatCommand, CommandType } from '../client.js';

/** Config options for Potato Bot */
type Config = {
	readonly logger: Logger;
	readonly mongodbUrl: string;
	readonly announcementTime: string;
	readonly announcementChannel: string;
	readonly databaseName: string;
	readonly gradeUpdateInterval: string;
	readonly weatherKey: string;
	readonly abstractKey: string;
	readonly downloadDirectory: string;
	readonly spotifyToken: string;
};

/** Global bot info used to respond to interactions recieved by Potato Bot */
type GlobalInfo = {
	readonly database: Db;
	readonly logger: Logger;
	readonly downloadDirectory: string;
	readonly spotifyToken: string;
	readonly weather?: WeatherResponse;
};

/** Guild-specific info used to respond to interactions recieved by Potato Bot */
type GuildInfo = {
	queueManager?: QueueManager;
};

/** Shorthand for a ChatCommand with Potato Bot global and guild info */
type PotatoChatCommand<T extends CommandType> = ChatCommand<T, GlobalInfo, GuildInfo>;
