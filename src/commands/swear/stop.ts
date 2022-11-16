import { type SwearChatCommand } from '../../types/bot-types/swear.js';
import { EmbedType, responseOptions } from '../../util/builders.js';

export const command: SwearChatCommand<'Guild'> = {
	data: {
		name: 'stop',
		description: 'Stop the song',
	},
	async respond(response, guildInfo) {
		guildInfo.player?.stop();
		await response.interaction.editReply(responseOptions(EmbedType.Success, 'Success'));
	},
	type: 'Guild',
};
