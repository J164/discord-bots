import type { PotatoChatCommand } from '../types/potato.js';
import { EmbedType, responseOptions } from '../util/builders.js';

export const command: PotatoChatCommand<'Guild'> = {
	data: {
		name: 'pause',
		description: 'Pause the song',
	},
	async respond(response, guildInfo) {
		if (guildInfo.queueManager?.pause()) {
			await response.interaction.editReply(responseOptions(EmbedType.Success, 'Paused!'));
			return;
		}

		await response.interaction.editReply(responseOptions(EmbedType.Error, "Sorry, can't do that right now"));
	},
	type: 'Guild',
};
