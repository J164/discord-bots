import { InteractionReplyOptions } from 'discord.js';
import { ChatCommand, GuildChatCommandInfo } from '../../bot-client.js';
import { responseOptions } from '../../utils/builders.js';

function resume(info: GuildChatCommandInfo): InteractionReplyOptions {
  if (info.voiceManager!.resume()) {
    return responseOptions('success', { title: 'Resumed!' });
  }
  return responseOptions('error', { title: 'Nothing is playing!' });
}

export const command: ChatCommand<'Guild'> = {
  data: {
    name: 'resume',
    description: 'Resume the song',
  },
  respond: resume,
  type: 'Guild',
};
