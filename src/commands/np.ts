import { InteractionReplyOptions } from 'discord.js';
import { GuildChatCommandInfo, GuildChatCommand } from '../util/interfaces.js';

function nowPlaying(info: GuildChatCommandInfo): InteractionReplyOptions {
  return { embeds: [info.queueManager.nowPlaying] };
}

export const command: GuildChatCommand = {
  data: {
    name: 'np',
    description: 'Get information on the song currently playing',
  },
  respond: nowPlaying,
  type: 'Guild',
};
