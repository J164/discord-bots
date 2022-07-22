import { ApplicationCommandOptionType, InteractionReplyOptions } from 'discord.js';
import { ChatCommand, GuildChatCommandInfo } from '../index.js';

function loop(info: GuildChatCommandInfo): InteractionReplyOptions {
  if (info.response.interaction.options.getSubcommand() === 'current') {
    return info.queueManager.loopSong();
  }
  return info.queueManager.loopQueue();
}

export const command: ChatCommand<'Guild'> = {
  data: {
    name: 'loop',
    description: 'Loop the current song or queue',
    options: [
      {
        name: 'current',
        description: 'Loop just the current song',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'queue',
        description: 'Loop the entire queue',
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },
  respond: loop,
  type: 'Guild',
};
