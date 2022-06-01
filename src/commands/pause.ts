import { InteractionReplyOptions } from 'discord.js';
import { ChatCommand, GuildChatCommandInfo } from '../potato-client.js';
import { responseOptions } from '../util/builders.js';

function pause(info: GuildChatCommandInfo): InteractionReplyOptions {
  if (info.queueManager.pause()) {
    return responseOptions('success', { title: 'Paused!' });
  }
  return responseOptions('error', { title: "Sorry, can't do that right now" });
}

export const command: ChatCommand<'Guild'> = {
  data: {
    name: 'pause',
    description: 'Pause the song',
  },
  respond: pause,
  type: 'Guild',
};
