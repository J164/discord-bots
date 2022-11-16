import { type PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, responseOptions } from '../../util/builders.js';

export const command: PotatoChatCommand<'Guild'> = {
	data: {
		name: 'resume',
		description: 'Resume song playback',
	},
	async respond(response, guildInfo) {
		if (guildInfo.queueManager?.resume()) {
			await response.interaction.editReply(responseOptions(EmbedType.Success, 'Resumed!'));
			return;
		}

		await response.interaction.editReply(responseOptions(EmbedType.Error, "Sorry, can't do that right now"));
	},
	type: 'Guild',
};
