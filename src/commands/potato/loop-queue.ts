import { type PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, responseOptions } from '../../util/helpers.js';

export const command: PotatoChatCommand<'Guild'> = {
	data: {
		name: 'loop-queue',
		description: 'Loop the queue',
	},
	async respond(response, guildInfo) {
		await response.interaction.editReply(guildInfo.queueManager?.loopQueue() ?? responseOptions(EmbedType.Error, 'Nothing is queued!'));
	},
	type: 'Guild',
};
