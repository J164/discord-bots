import { ApplicationCommandOptionChoiceData, ApplicationCommandOptionType, ChannelType, InteractionReplyOptions } from 'discord.js';
import ytpl from 'ytpl';
import ytsr from 'ytsr';
import config from '../config.json' assert { type: 'json' };
import { ChatCommand, GuildAutocompleteInfo, GuildChatCommandInfo } from '../potato-client.js';
import { responseOptions } from '../util/builders.js';
import { logger } from '../util/logger.js';
import { resolve } from '../voice/ytdl.js';
import { QueueItem } from '../voice/queue-manager.js';

interface SpotifyResponse {
  readonly name: string;
  readonly external_urls: { readonly spotify: string };
  readonly images: readonly { readonly url: string }[];
  readonly tracks: {
    readonly items: readonly {
      readonly track: {
        readonly name: string;
        readonly artists: readonly {
          readonly name: string;
        }[];
      };
    }[];
  };
}

async function parseUrl(url: string): Promise<{ response: InteractionReplyOptions; songs: QueueItem[] }> {
  if (/^(?:https?:\/\/)?(?:www\.)?open\.spotify\.com\/playlist\/([A-Za-z\d-_&=?]+)$/.test(url)) {
    const token = (await (
      await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${config.SPOTIFY_TOKEN}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      })
    ).json()) as { access_token: string };

    let response: SpotifyResponse;
    try {
      response = (await (
        await fetch(`https://api.spotify.com/v1/playlists/${/^(?:https?:\/\/)?(?:www\.)?open\.spotify\.com\/playlist\/([A-Za-z\d-_]+)$/.exec(url)![1]}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token.access_token}` },
        })
      ).json()) as SpotifyResponse;
    } catch {
      throw new Error('Spotify authentication failed');
    }

    return {
      songs: (
        await Promise.all(
          response.tracks.items.map(async (song) => {
            const filter = (await ytsr.getFilters(`${song.track.name} ${song.track.artists[0].name}`)).get('Type')?.get('Video')?.url;
            if (!filter) {
              return;
            }
            const term = await ytsr(filter, {
              limit: 1,
            });
            if (term.results < 1) {
              return;
            }
            const ytvideo = term.items[0] as ytsr.Video;
            return {
              url: ytvideo.url,
              title: ytvideo.title,
              duration: ytvideo.duration!,
              thumbnail: ytvideo.bestThumbnail.url!,
            };
          }),
        )
      ).filter(Boolean) as QueueItem[],
      response: responseOptions('success', {
        title: `Added "${response.name}" to queue!`,
        fields: [
          {
            name: 'URL:',
            value: response.external_urls.spotify,
          },
        ],
        image: { url: response.images[0].url },
      }),
    };
  }

  if (/^(?:https?:\/\/)?(?:www\.)?youtube\.com\/playlist\?list=([A-Za-z\d-_&=?]+)$/.test(url)) {
    let results;
    try {
      results = await ytpl(url);
    } catch {
      throw new Error('Invalid URL');
    }

    return {
      songs: results.items.map((item) => {
        return {
          url: item.shortUrl,
          title: item.title,
          duration: item.duration!,
          thumbnail: item.bestThumbnail.url!,
        };
      }),
      response: responseOptions('success', {
        title: `Added playlist "${results.title}" to queue!`,
        fields: [{ name: 'URL:', value: url }],
        image: { url: results.bestThumbnail.url! },
      }),
    };
  }

  if (/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([A-Za-z\d-_&=?]+)$/.test(url)) {
    const result = await resolve(url);
    const hour = Math.floor(result.duration / 3600);
    const min = Math.floor((result.duration % 3600) / 60);
    const sec = result.duration % 60;

    return {
      songs: [
        {
          url: result.webpage_url,
          title: result.title,
          duration: `${hour > 0 ? (hour < 10 ? `0${hour}:` : `${hour}:`) : ''}${min < 10 ? `0${min}` : min}:${sec < 10 ? `0${sec}` : sec}`,
          thumbnail: result.thumbnail,
        },
      ],
      response: responseOptions('success', {
        title: `Added "${result.title}" to queue!`,
        fields: [{ name: 'URL:', value: result.webpage_url }],
        image: { url: result.thumbnail },
      }),
    };
  }

  const filter = (await ytsr.getFilters(url)).get('Type')?.get('Video')?.url;
  if (!filter) {
    throw new Error('No results');
  }
  const term = await ytsr(filter, {
    limit: 1,
  });
  if (term.results < 1) {
    throw new Error('No results');
  }
  const result = term.items[0] as ytsr.Video;

  return {
    songs: [
      {
        url: result.url,
        title: result.title,
        duration: result.duration!,
        thumbnail: result.bestThumbnail.url!,
      },
    ],
    response: responseOptions('success', {
      title: `Added "${result.title}" to queue!`,
      fields: [{ name: 'URL:', value: result.url }],
      image: { url: result.bestThumbnail.url! },
    }),
  };
}

async function play(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
  const voiceChannel = info.response.interaction.channel?.isVoice() ? info.response.interaction.channel : info.response.interaction.member.voice.channel;
  if (!voiceChannel?.joinable || voiceChannel.type !== ChannelType.GuildVoice) {
    return responseOptions('error', { title: 'This command can only be used in a voice channel!' });
  }

  void info.response.interaction.editReply(responseOptions('info', { title: 'Boiling potatoes...' }));

  let parsed: { songs: QueueItem[]; response: InteractionReplyOptions };
  try {
    parsed = await parseUrl(info.response.interaction.options.getString('name', true).trim());
  } catch (error) {
    logger.error(
      { error: error, options: info.response.interaction.options.data },
      `Chat Command Interaction #${info.response.interaction.id}) threw an error when locating songs`,
    );
    return responseOptions('error', { title: 'Song not found' });
  }
  await info.queueManager.addToQueue(parsed.songs, info.response.interaction.options.getInteger('position') ?? 0 - 1);
  await info.queueManager.connect(voiceChannel);
  return parsed.response;
}

async function search(info: GuildAutocompleteInfo): Promise<ApplicationCommandOptionChoiceData[]> {
  if (
    (info.option.value as string).length < 3 ||
    /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([A-Za-z\d-_&=?]+)$/.test(info.option.value as string) ||
    /^(?:https?:\/\/)?(?:www\.)?open\.spotify\.com\/playlist\/([A-Za-z\d-_&=?]+)$/.test(info.option.value as string)
  )
    return [];
  const filter = (await ytsr.getFilters(info.option.value as string)).get('Type')?.get('Video')?.url;
  if (!filter) {
    return [];
  }
  const results = await ytsr(filter, {
    limit: 4,
  });
  const options = (results.items as ytsr.Video[]).map((result) => {
    return {
      name: result.title,
      value: result.url,
    };
  });
  return options;
}

export const command: ChatCommand<'Guild'> = {
  data: {
    name: 'play',
    description: 'Play a song',
    options: [
      {
        name: 'name',
        description: 'The URL or title of the song',
        type: ApplicationCommandOptionType.String,
        required: true,
        autocomplete: true,
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
  respond: play,
  autocomplete: search,
  ephemeral: true,
  type: 'Guild',
};
