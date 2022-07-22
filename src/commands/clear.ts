import { InteractionReplyOptions } from 'discord.js';
import { ChatCommand, GuildChatCommandInfo } from '../potato-client.js';
import { responseOptions } from '../util/builders.js';

async function clear(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
  if (await info.queueManager.clear()) {
    return responseOptions('success', { title: 'The queue has been cleared' });
  }
  return responseOptions('error', { title: 'There is no queue!' });
}

export const command: ChatCommand<'Guild'> = {
  data: {
    name: 'clear',
    description: 'Clear the song queue',
  },
  respond: clear,
  type: 'Guild',
};
