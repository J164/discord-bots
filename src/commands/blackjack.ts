import { playBlackjack } from '../modules/games/blackjack.js';
import type { ChatCommand } from '../types/commands.js';
import { EmbedType, responseOptions } from '../util/builders.js';

export const command: ChatCommand<'Global'> = {
	data: {
		name: 'blackjack',
		description: 'Play Blackjack',
	},
	async respond(response) {
		void playBlackjack(await response.interaction.user.createDM());
		await response.interaction.editReply(responseOptions(EmbedType.Success, 'Success!'));
	},
	type: 'Global',
};
