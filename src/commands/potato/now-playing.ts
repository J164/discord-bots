import { type PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, responseOptions } from '../../util/helpers.js';

export const command: PotatoChatCommand<'Guild'> = {
	data: {
		name: 'now-playing',
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
						footer: guildInfo.queueManager.nowPlaying.audio.looping
							? {
									text: '\uD83D\uDD01\tLooping',
							  }
							: {
									text: 'Use "/loop-current" to loop',
							  },
				  })
				: responseOptions(EmbedType.Error, 'Nothing has played yet!'),
		);
	},
	type: 'Guild',
};
