import { InteractionReplyOptions } from 'discord.js';
import ytpl from 'ytpl';
import { buildEmbed } from '../util/builders.js';
import { GuildChatCommandInfo, GuildChatCommand } from '../util/interfaces.js';

async function featured(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
  const voiceChannel = (await info.interaction.guild.members.fetch(info.interaction.user)).voice.channel;
  if (!voiceChannel?.joinable || voiceChannel.type !== 'GUILD_VOICE') {
    return {
      embeds: [
        buildEmbed('error', {
          title: 'This command can only be used while in a visable voice channel!',
        }),
      ],
    };
  }
  const results = await ytpl(info.interaction.options.getString('name')).catch((): false => {
    void info.interaction.editReply({
      embeds: [
        buildEmbed('error', {
          title: 'Something went wrong. Please contact the developer',
        }),
      ],
    });
    return false;
  });
  if (!results) return;
  const items = results.items.map((item) => {
    return {
      url: item.shortUrl,
      title: item.title,
      duration: item.duration,
      thumbnail: item.bestThumbnail.url,
    };
  });
  await info.queueManager.addToQueue(items, info.interaction.options.getInteger('position') - 1);
  await info.queueManager.connect(voiceChannel);
  return {
    embeds: [
      buildEmbed('success', {
        title: `Added playlist "${results.title}" to queue!`,
        image: { url: results.bestThumbnail.url },
      }),
    ],
  };
}

export const command: GuildChatCommand = {
  data: {
    name: 'featured',
    description: 'Play a song from the list of featured playlists',
    options: [
      {
        name: 'name',
        description: 'The name of the playlist',
        type: 3,
        required: true,
        choices: [
          {
            name: 'epic',
            value: 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY4lfQYkEb60nitxrJMpN5a2',
          },
          {
            name: 'magic',
            value: 'https://www.youtube.com/playlist?list=PLt3HR7cu4NMNUoQx1q5ullRMW-ZwosuNl',
          },
          {
            name: 'undertale',
            value: 'https://www.youtube.com/playlist?list=PLLSgIflCqVYMBjn63DEn0b6-sqKZ9xh_x',
          },
          {
            name: 'fun',
            value: 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY77NZ6oE4PbkFarsOIyQcGD',
          },
        ],
      },
      {
        name: 'position',
        description: 'Where in the queue to put the song (defaults to the end)',
        type: 4,
        minValue: 1,
        required: false,
      },
    ],
  },
  respond: featured,
  ephemeral: true,
  type: 'Guild',
};
