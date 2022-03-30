import { InteractionReplyOptions } from 'discord.js';
import { buildEmbed } from '../util/builders.js';
import { GuildChatCommandInfo, GuildChatCommand } from '../util/interfaces.js';

async function stop(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
  await info.queueManager.reset();
  return { embeds: [buildEmbed('success', { title: 'Success' })] };
}

export const command: GuildChatCommand = {
  data: {
    name: 'stop',
    description: 'Disconnects Potato Bot from voice',
  },
  respond: stop,
  type: 'Guild',
};
