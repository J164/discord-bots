import { InteractionReplyOptions } from 'discord.js';
import { buildEmbed } from '../util/builders.js';
import { GuildChatCommandInfo, GuildChatCommand } from '../util/interfaces.js';

async function shuffle(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
  if (await info.queueManager.shuffleQueue()) {
    return {
      embeds: [buildEmbed('success', { title: 'Queue shuffled!' })],
    };
  }
  return {
    embeds: [buildEmbed('error', { title: 'There is nothing to shuffle!' })],
  };
}

export const command: GuildChatCommand = {
  data: {
    name: 'shuffle',
    description: 'Shuffles the song queue',
  },
  respond: shuffle,
  type: 'Guild',
};
