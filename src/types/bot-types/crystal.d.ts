import { type Logger } from 'pino';
import { type Player } from '../../voice/player.js';
import { type ChatCommand, type CommandType } from '../client.js';

/** Global bot info used to respond to interactions recieved by Potato Bot */
type GlobalInfo = {
	readonly logger: Logger;
};

/** Guild-specific info used to respond to interactions recieved by Potato Bot */
type GuildInfo = {
	player?: Player;
};

/** Shorthand for a ChatCommand with Yeet Bot global and guild info */
type CrystalChatCommand<T extends CommandType> = ChatCommand<T, GlobalInfo, GuildInfo>;
