import { InteractionReplyOptions } from 'discord.js';
import { buildEmbed } from '../util/builders.js';
import { GuildChatCommandInfo, GuildChatCommand } from '../util/interfaces.js';

function clear(info: GuildChatCommandInfo): InteractionReplyOptions {
  if (info.queueManager.clear()) {
    return {
      embeds: [buildEmbed('success', { title: 'The queue has been cleared' })],
    };
  }
  return { embeds: [buildEmbed('error', { title: 'There is no queue!' })] };
}

export const command: GuildChatCommand = {
  data: {
    name: 'clear',
    description: 'Clear the song queue',
  },
  respond: clear,
  type: 'Guild',
};
