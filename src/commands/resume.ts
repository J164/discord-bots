import { InteractionReplyOptions } from 'discord.js';
import { buildEmbed } from '../util/builders.js';
import { GuildChatCommandInfo, GuildChatCommand } from '../util/interfaces.js';

function resume(info: GuildChatCommandInfo): InteractionReplyOptions {
  if (info.queueManager.resume()) {
    return { embeds: [buildEmbed('success', { title: 'Resumed!' })] };
  }
  return { embeds: [buildEmbed('error', { title: 'Nothing is playing!' })] };
}

export const command: GuildChatCommand = {
  data: {
    name: 'resume',
    description: 'Resume song playback',
  },
  respond: resume,
  type: 'Guild',
};
