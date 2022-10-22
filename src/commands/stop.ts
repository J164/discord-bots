import type { ChatCommand } from '../types/commands.js';
import { EmbedType, responseOptions } from '../util/builders.js';

export const command: ChatCommand<'Guild'> = {
	data: {
		name: 'stop',
		description: 'Disconnects Potato Bot from voice',
	},
	async respond(response, guildInfo) {
		guildInfo.queueManager?.reset();
		await response.interaction.editReply(responseOptions(EmbedType.Success, 'Success!'));
	},
	type: 'Guild',
};
