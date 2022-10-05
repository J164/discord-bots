import type { InteractionReplyOptions } from 'discord.js';
import { ApplicationCommandOptionType } from 'discord.js';
import type { ChatCommand, GlobalChatCommandInfo, GuildInfo } from '../types/commands.js';
import { responseOptions } from '../util/builders.js';

function loop(globalInfo: GlobalChatCommandInfo<'Guild'>, guildInfo: GuildInfo): InteractionReplyOptions {
	if (globalInfo.response.interaction.options.getSubcommand() === 'current') {
		return guildInfo.queueManager?.loopSong() ?? responseOptions('error', { title: 'Nothing is playing!' });
	}

	return guildInfo.queueManager?.loopQueue() ?? responseOptions('error', { title: 'Nothing is queued!' });
}

export const command: ChatCommand<'Guild'> = {
	data: {
		name: 'loop',
		description: 'Loop the current song or queue',
		options: [
			{
				name: 'current',
				description: 'Loop just the current song',
				type: ApplicationCommandOptionType.Subcommand,
			},
			{
				name: 'queue',
				description: 'Loop the entire queue',
				type: ApplicationCommandOptionType.Subcommand,
			},
		],
	},
	respond: loop,
	type: 'Guild',
};
