import { type PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, responseOptions } from '../../util/builders.js';

export const command: PotatoChatCommand<'Guild'> = {
	data: {
		name: 'np',
		description: 'Get information on the song currently playing',
	},
	async respond(response, guildInfo) {
		await response.interaction.editReply(
			guildInfo.queueManager?.nowPlaying
				? responseOptions(EmbedType.Info, `Now Playing: ${guildInfo.queueManager.nowPlaying.title} (${guildInfo.queueManager.nowPlaying.duration})`, {
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
							: {
									text: 'Use "/loopcurrent" to loop',
							  },
				  })
				: responseOptions(EmbedType.Error, 'Nothing has played yet!'),
		);
	},
	type: 'Guild',
};
