import { InteractionReplyOptions } from 'discord.js';
import { playBlackjack } from '../modules/games/blackjack.js';
import { ChatCommand, GlobalChatCommandInfo } from '../potato-client.js';
import { responseOptions } from '../util/builders.js';

async function blackjack(info: GlobalChatCommandInfo): Promise<InteractionReplyOptions> {
  void playBlackjack(await info.response.interaction.user.createDM());
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
