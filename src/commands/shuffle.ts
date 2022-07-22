import { InteractionReplyOptions } from 'discord.js';
import { ChatCommand, GuildChatCommandInfo } from '../index.js';
import { responseOptions } from '../util/builders.js';

async function shuffle(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
  if (await info.queueManager.shuffleQueue()) {
    return responseOptions('success', { title: 'Queue shuffled!' });
  }
  return responseOptions('error', { title: 'There is nothing to shuffle!' });
}

export const command: ChatCommand<'Guild'> = {
  data: {
    name: 'shuffle',
    description: 'Shuffles the song queue',
  },
  respond: shuffle,
  type: 'Guild',
};
