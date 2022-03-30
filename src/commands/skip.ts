import { InteractionReplyOptions } from 'discord.js';
import { buildEmbed } from '../util/builders.js';
import { GuildChatCommandInfo, GuildChatCommand } from '../util/interfaces.js';

function skip(info: GuildChatCommandInfo): InteractionReplyOptions {
  if (info.queueManager.skip()) {
    return { embeds: [buildEmbed('success', { title: 'Skipped' })] };
  }
  return {
    embeds: [buildEmbed('error', { title: 'There is nothing to skip!' })],
  };
}

export const command: GuildChatCommand = {
  data: {
    name: 'skip',
    description: 'Skip the current song',
  },
  respond: skip,
  type: 'Guild',
};
