import type { PotatoChatCommand } from '../types/potato.js';
import { EmbedType, responseOptions } from '../util/builders.js';

export const command: PotatoChatCommand<'Guild'> = {
	data: {
		name: 'shuffle',
		description: 'Shuffles the song queue',
	},
	async respond(response, guildInfo) {
		if (guildInfo.queueManager?.shuffleQueue()) {
			await response.interaction.editReply(responseOptions(EmbedType.Success, 'Queue shuffled!'));
			return;
		}

		await response.interaction.editReply(responseOptions(EmbedType.Error, 'There is nothing to shuffle!'));
	},
	type: 'Guild',
};
