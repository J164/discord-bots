import { playBlackjack } from '../modules/games/blackjack.js';
import type { PotatoChatCommand } from '../types/potato.js';
import { EmbedType, responseOptions } from '../util/builders.js';

export const command: PotatoChatCommand<'Global'> = {
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
