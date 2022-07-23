import { InteractionReplyOptions } from 'discord.js';
import { ChatCommand, GuildChatCommandInfo } from '../index.js';
import { responseOptions } from '../util/builders.js';

function nowPlaying(info: GuildChatCommandInfo): InteractionReplyOptions {
  return info.queueManager.nowPlaying
    ? responseOptions('info', {
        title: `Now Playing: ${info.queueManager.nowPlaying.title} (${info.queueManager.nowPlaying.duration})`,
        fields: [
          {
            name: 'URL:',
            value: info.queueManager.nowPlaying.url,
          },
        ],
        image: { url: info.queueManager.nowPlaying.thumbnail },
        footer: info.queueManager.nowPlaying.looping
          ? {
              text: 'Looping',
              icon_url: 'https://www.clipartmax.com/png/middle/353-3539119_arrow-repeat-icon-cycle-loop.png',
            }
          : undefined,
      })
    : responseOptions('error', { title: 'Nothing has played yet!' });
}

export const command: ChatCommand<'Guild'> = {
  data: {
    name: 'np',
    description: 'Get information on the song currently playing',
  },
  respond: nowPlaying,
  type: 'Guild',
};
