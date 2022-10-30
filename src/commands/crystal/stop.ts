import type { CrystalChatCommand } from '../../types/bot-types/crystal.js';
import { EmbedType, responseOptions } from '../../util/builders.js';

export const command: CrystalChatCommand<'Guild'> = {
	data: {
		name: 'stop',
		description: 'Stop the song',
	},
	async respond(response, guildInfo) {
		guildInfo.player?.stop();
		await response.interaction.editReply(responseOptions(EmbedType.Success, 'Success'));
	},
	type: 'Guild',
};
