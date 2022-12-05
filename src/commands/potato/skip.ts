import { type PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, responseOptions } from '../../util/builders.js';

export const command: PotatoChatCommand<'Guild'> = {
	data: {
		name: 'skip',
		description: 'Skip the current song',
	},
	async respond(response, guildInfo) {
		if (guildInfo.queueManager?.skip()) {
			await response.interaction.editReply(responseOptions(EmbedType.Success, 'Skipped'));
			return;
		}

		await response.interaction.editReply(responseOptions(EmbedType.Error, 'There is nothing to skip!'));
	},
	type: 'Guild',
};
