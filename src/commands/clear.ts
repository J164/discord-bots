import { InteractionReplyOptions } from 'discord.js';
import { ChatCommand, GuildChatCommandInfo } from '../index.js';
import { responseOptions } from '../util/builders.js';

async function clear(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
  await info.queueManager.clear();
  return responseOptions('success', { title: 'The queue has been cleared' });
}

export const command: ChatCommand<'Guild'> = {
  data: {
    name: 'clear',
    description: 'Clear the song queue',
  },
  respond: clear,
  type: 'Guild',
};
