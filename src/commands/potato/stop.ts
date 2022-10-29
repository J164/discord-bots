import type { PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, responseOptions } from '../../util/builders.js';

export const command: PotatoChatCommand<'Guild'> = {
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
