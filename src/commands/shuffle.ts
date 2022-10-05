import type { InteractionReplyOptions } from 'discord.js';
import type { ChatCommand, GlobalChatCommandInfo, GuildInfo } from '../types/commands.js';
import { responseOptions } from '../util/builders.js';

function shuffle(globalInfo: GlobalChatCommandInfo<'Guild'>, guildInfo: GuildInfo): InteractionReplyOptions {
	if (guildInfo.queueManager?.shuffleQueue()) {
		return responseOptions('success', { title: 'Queue shuffled!' });
	}

	return responseOptions('error', { title: 'There is nothing to shuffle!' });
}

export const command: ChatCommand<'Guild'> = {
	data: {
		name: 'shuffle',
		description: 'Shuffles the song queue',
	},
	respond: shuffle,
	type: 'Guild',
};
