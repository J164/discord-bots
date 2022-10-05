import type { InteractionReplyOptions } from 'discord.js';
import { playBlackjack } from '../modules/games/blackjack.js';
import type { GlobalChatCommandInfo, ChatCommand } from '../types/commands.js';
import { responseOptions } from '../util/builders.js';

async function blackjack(globalInfo: GlobalChatCommandInfo<'Global'>): Promise<InteractionReplyOptions> {
	void playBlackjack(await globalInfo.response.interaction.user.createDM());
	return responseOptions('success', { title: 'Success!' });
}

export const command: ChatCommand<'Global'> = {
	data: {
		name: 'blackjack',
		description: 'Play Blackjack',
	},
	respond: blackjack,
	type: 'Global',
};
