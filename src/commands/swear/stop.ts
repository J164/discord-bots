import { InteractionReplyOptions } from 'discord.js';
import { ChatCommand, GuildChatCommandInfo } from '../../bot-client.js';
import { responseOptions } from '../../utils/builders.js';

function stop(info: GuildChatCommandInfo): InteractionReplyOptions {
  info.voiceManager!.reset();
  return responseOptions('success', { title: 'Success' });
}

export const command: ChatCommand<'Guild'> = {
  data: {
    name: 'stop',
    description: 'Stop the song',
  },
  respond: stop,
  type: 'Guild',
};
