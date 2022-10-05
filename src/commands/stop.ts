import type { InteractionReplyOptions } from 'discord.js';
import type { ChatCommand, GlobalChatCommandInfo, GuildInfo } from '../types/commands.js';
import { responseOptions } from '../util/builders.js';

function stop(globalInfo: GlobalChatCommandInfo<'Guild'>, guildInfo: GuildInfo): InteractionReplyOptions {
	guildInfo.queueManager?.reset();
	return responseOptions('success', { title: 'Success' });
}

export const command: ChatCommand<'Guild'> = {
	data: {
		name: 'stop',
		description: 'Disconnects Potato Bot from voice',
	},
	respond: stop,
	type: 'Guild',
};
