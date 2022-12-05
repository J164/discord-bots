import { type SwearChatCommand } from '../../types/bot-types/swear.js';
import { EmbedType, responseOptions } from '../../util/builders.js';

export const command: SwearChatCommand<'Guild'> = {
	data: {
		name: 'resume',
		description: 'Resume the song',
	},
	async respond(response, guildInfo) {
		if (guildInfo.player?.resume()) {
			await response.interaction.editReply(responseOptions(EmbedType.Success, 'Resumed!'));
			return;
		}

		await response.interaction.editReply(responseOptions(EmbedType.Error, 'Nothing is playing'));
	},
	type: 'Guild',
};
