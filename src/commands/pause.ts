import type { InteractionReplyOptions } from 'discord.js';
import type { ChatCommand, GlobalChatCommandInfo, GuildInfo } from '../types/commands.js';
import { responseOptions } from '../util/builders.js';

function pause(globalInfo: GlobalChatCommandInfo<'Guild'>, guildInfo: GuildInfo): InteractionReplyOptions {
	if (guildInfo.queueManager?.pause()) {
		return responseOptions('success', { title: 'Paused!' });
	}

	return responseOptions('error', { title: "Sorry, can't do that right now" });
}

export const command: ChatCommand<'Guild'> = {
	data: {
		name: 'pause',
		description: 'Pause the song',
	},
	respond: pause,
	type: 'Guild',
};
