import { ApplicationCommandOptionType, ChannelType, InteractionReplyOptions } from 'discord.js';
import ytpl from 'ytpl';
import { ChatCommand, GuildChatCommandInfo } from '../potato-client.js';
import { responseOptions } from '../util/builders.js';

async function featured(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
  const voiceChannel = info.response.interaction.channel?.isVoice() ? info.response.interaction.channel : info.response.interaction.member.voice.channel;
  if (!voiceChannel?.joinable || voiceChannel.type !== ChannelType.GuildVoice) {
    return responseOptions('error', {
      title: 'This command can only be used in a voice channel!',
    });
  }
  let results;
  try {
    results = await ytpl(info.response.interaction.options.getString('name', true));
  } catch {
    return responseOptions('error', {
      title: 'Something went wrong. Please use /report to report the problem',
    });
  }
  const items = results.items.map((item) => {
    return {
      url: item.shortUrl,
      title: item.title,
      duration: item.duration!,
      thumbnail: item.bestThumbnail.url!,
    };
  });
  await info.queueManager.addToQueue(items, info.response.interaction.options.getInteger('position') ?? 0 - 1);
  await info.queueManager.connect(voiceChannel);
  return responseOptions('success', {
    title: `Added playlist "${results.title}" to queue!`,
    image: { url: results.bestThumbnail.url! },
  });
}

export const command: ChatCommand<'Guild'> = {
  data: {
    name: 'featured',
    description: 'Play a song from the list of featured playlists',
    options: [
      {
        name: 'name',
        description: 'The name of the playlist',
        type: ApplicationCommandOptionType.String,
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
        type: ApplicationCommandOptionType.Integer,
        minValue: 1,
        required: false,
      },
    ],
  },
  respond: featured,
  ephemeral: true,
  type: 'Guild',
};
