import { InteractionReplyOptions } from 'discord.js';
import { ChatCommand, GuildChatCommandInfo } from '../index.js';
import { responseOptions } from '../util/builders.js';

function resume(info: GuildChatCommandInfo): InteractionReplyOptions {
  if (info.queueManager.resume()) {
    return responseOptions('success', { title: 'Resumed!' });
  }
  return responseOptions('error', { title: "Sorry, can't do that right now" });
}

export const command: ChatCommand<'Guild'> = {
  data: {
    name: 'resume',
    description: 'Resume song playback',
  },
  respond: resume,
  type: 'Guild',
};
