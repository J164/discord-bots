import type { InteractionReplyOptions } from 'discord.js';
import type { GlobalChatCommandInfo, GuildInfo, ChatCommand } from '../types/commands.js';
import { responseOptions } from '../util/builders.js';

function clear(globalInfo: GlobalChatCommandInfo<'Guild'>, guildInfo: GuildInfo): InteractionReplyOptions {
	guildInfo.queueManager?.clear();
	return responseOptions('success', { title: 'The queue has been cleared' });
}

export const command: ChatCommand<'Guild'> = {
	data: {
		name: 'clear',
		description: 'Clear the song queue',
	},
	respond: clear,
	type: 'Guild',
};
