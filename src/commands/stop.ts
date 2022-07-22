import { InteractionReplyOptions } from 'discord.js';
import { ChatCommand, GuildChatCommandInfo } from '../index.js';
import { responseOptions } from '../util/builders.js';

async function stop(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
  await info.queueManager.reset();
  return responseOptions('success', { title: 'Success' });
}

export const command: ChatCommand<'Guild'> = {
  data: {
    name: 'stop',
    description: 'Disconnects Potato Bot from voice',
  },
  respond: stop,
  type: 'Guild',
};
