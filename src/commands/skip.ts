import { InteractionReplyOptions } from 'discord.js';
import { ChatCommand, GuildChatCommandInfo } from '../potato-client.js';
import { responseOptions } from '../util/builders.js';

function skip(info: GuildChatCommandInfo): InteractionReplyOptions {
  if (info.queueManager.skip()) {
    return responseOptions('success', { title: 'Skipped' });
  }
  return responseOptions('error', { title: 'There is nothing to skip!' });
}

export const command: ChatCommand<'Guild'> = {
  data: {
    name: 'skip',
    description: 'Skip the current song',
  },
  respond: skip,
  type: 'Guild',
};
