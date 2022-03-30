import { InteractionReplyOptions } from 'discord.js';
import { GuildChatCommandInfo, GuildChatCommand } from '../util/interfaces.js';

function loop(info: GuildChatCommandInfo): InteractionReplyOptions {
  if (info.interaction.options.getSubcommand() === 'current') {
    return { embeds: [info.queueManager.loopSong()] };
  }
  return { embeds: [info.queueManager.loopQueue()] };
}

export const command: GuildChatCommand = {
  data: {
    name: 'loop',
    description: 'Loop the current song or queue',
    options: [
      {
        name: 'current',
        description: 'Loop just the current song',
        type: 1,
      },
      {
        name: 'queue',
        description: 'Loop the entire queue',
        type: 1,
      },
    ],
  },
  respond: loop,
  type: 'Guild',
};
