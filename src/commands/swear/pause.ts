import type { SwearChatCommand } from '../../types/bot-types/swear.js';
import { EmbedType, responseOptions } from '../../util/builders.js';

export const command: SwearChatCommand<'Guild'> = {
	data: {
		name: 'pause',
		description: 'Pause the song',
	},
	async respond(response, guildInfo) {
		if (guildInfo.player?.pause()) {
			await response.interaction.editReply(responseOptions(EmbedType.Success, 'Paused!'));
			return;
		}

		await response.interaction.editReply(responseOptions(EmbedType.Error, 'Nothing is playing'));
	},
	type: 'Guild',
};
