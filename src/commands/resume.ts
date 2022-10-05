import type { InteractionReplyOptions } from 'discord.js';
import type { ChatCommand, GlobalChatCommandInfo, GuildInfo } from '../types/commands.js';
import { responseOptions } from '../util/builders.js';

function resume(globalInfo: GlobalChatCommandInfo<'Guild'>, guildInfo: GuildInfo): InteractionReplyOptions {
	if (guildInfo.queueManager?.resume()) {
		return responseOptions('success', { title: 'Resumed!' });
	}

	return responseOptions('error', { title: "Sorry, can't do that right now" });
}

export const command: ChatCommand<'Guild'> = {
	data: {
		name: 'resume',
		description: 'Resume song playback',
	},
	respond: resume,
	type: 'Guild',
};
