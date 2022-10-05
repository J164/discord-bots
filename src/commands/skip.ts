import type { InteractionReplyOptions } from 'discord.js';
import type { ChatCommand, GlobalChatCommandInfo, GuildInfo } from '../types/commands.js';
import { responseOptions } from '../util/builders.js';

function skip(globalInfo: GlobalChatCommandInfo<'Guild'>, guildInfo: GuildInfo): InteractionReplyOptions {
	if (guildInfo.queueManager?.skip()) {
		return responseOptions('success', { title: 'Skipped' });
	}

	return responseOptions('error', { title: 'There is nothing to skip!' });
}

export const command: ChatCommand<'Guild'> = {
	data: {
		name: 'skip',
		description: 'Skip the current song',
	},
	respond: skip,
	type: 'Guild',
};
