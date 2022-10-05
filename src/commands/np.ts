import type { InteractionReplyOptions } from 'discord.js';
import type { ChatCommand, GlobalChatCommandInfo, GuildInfo } from '../types/commands.js';
import { responseOptions } from '../util/builders.js';

function nowPlaying(globalInfo: GlobalChatCommandInfo<'Guild'>, guildInfo: GuildInfo): InteractionReplyOptions {
	return guildInfo.queueManager?.nowPlaying
		? responseOptions('info', {
				title: `Now Playing: ${guildInfo.queueManager.nowPlaying.title} (${guildInfo.queueManager.nowPlaying.duration})`,
				fields: [
					{
						name: 'URL:',
						value: guildInfo.queueManager.nowPlaying.url,
					},
				],
				image: { url: guildInfo.queueManager.nowPlaying.thumbnail },
				footer: guildInfo.queueManager.nowPlaying.looping
					? {
							text: 'Looping',
							icon_url: 'https://www.clipartmax.com/png/middle/353-3539119_arrow-repeat-icon-cycle-loop.png',
					  }
					: undefined,
		  })
		: responseOptions('error', { title: 'Nothing has played yet!' });
}

export const command: ChatCommand<'Guild'> = {
	data: {
		name: 'np',
		description: 'Get information on the song currently playing',
	},
	respond: nowPlaying,
	type: 'Guild',
};
