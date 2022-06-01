import { InteractionReplyOptions } from 'discord.js';
import { ChatCommand, GuildChatCommandInfo } from '../potato-client.js';

function nowPlaying(info: GuildChatCommandInfo): InteractionReplyOptions {
  return info.queueManager.nowPlaying;
}

export const command: ChatCommand<'Guild'> = {
  data: {
    name: 'np',
    description: 'Get information on the song currently playing',
  },
  respond: nowPlaying,
  type: 'Guild',
};
