import { InteractionReplyOptions } from 'discord.js';
import { ChatCommand, GuildChatCommandInfo } from '../../bot-client.js';
import { responseOptions } from '../../utils/builders.js';

function pause(info: GuildChatCommandInfo): InteractionReplyOptions {
  if (info.voiceManager!.pause()) {
    return responseOptions('success', { title: 'Paused!' });
  }
  return responseOptions('error', { title: 'Nothing is playing' });
}

export const command: ChatCommand<'Guild'> = {
  data: {
    name: 'pause',
    description: 'Pause the song',
  },
  respond: pause,
  type: 'Guild',
};
