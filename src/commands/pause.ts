import { InteractionReplyOptions } from 'discord.js';
import { buildEmbed } from '../util/builders.js';
import { GuildChatCommandInfo, GuildChatCommand } from '../util/interfaces.js';

function pause(info: GuildChatCommandInfo): InteractionReplyOptions {
  if (info.queueManager.pause()) {
    return { embeds: [buildEmbed('success', { title: 'Paused!' })] };
  }
  return { embeds: [buildEmbed('error', { title: 'Nothing is playing' })] };
}

export const command: GuildChatCommand = {
  data: {
    name: 'pause',
    description: 'Pause the song',
  },
  respond: pause,
  type: 'Guild',
};
