import { type PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, responseOptions } from '../../util/builders.js';

export const command: PotatoChatCommand<'Guild'> = {
	data: {
		name: 'loop-current',
		description: 'Loop the current song',
	},
	async respond(response, guildInfo) {
		await response.interaction.editReply(guildInfo.queueManager?.loopSong() ?? responseOptions(EmbedType.Error, 'Nothing is playing!'));
	},
	type: 'Guild',
};
