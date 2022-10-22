import type { ChatCommand } from '../types/commands.js';
import { EmbedType, responseOptions } from '../util/builders.js';

export const command: ChatCommand<'Guild'> = {
	data: {
		name: 'clear',
		description: 'Clear the song queue',
	},
	async respond(response, guildInfo) {
		guildInfo.queueManager?.clear();
		await response.interaction.editReply(responseOptions(EmbedType.Success, 'The queue has been cleared'));
	},
	type: 'Guild',
};
