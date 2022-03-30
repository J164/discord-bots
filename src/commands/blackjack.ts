import { InteractionReplyOptions } from 'discord.js';
import { playBlackjack } from '../modules/games/blackjack.js';
import { buildEmbed } from '../util/builders.js';
import { GlobalChatCommandInfo, GlobalChatCommand } from '../util/interfaces.js';

async function blackjack(info: GlobalChatCommandInfo): Promise<InteractionReplyOptions> {
  void playBlackjack(await info.interaction.user.createDM());
  return { embeds: [buildEmbed('success', { title: 'Success!' })] };
}

export const command: GlobalChatCommand = {
  data: {
    name: 'blackjack',
    description: 'Play Blackjack',
  },
  respond: blackjack,
  type: 'Global',
};
