import { ApplicationCommandOptionChoice, InteractionReplyOptions, VoiceChannel } from 'discord.js';
import ytsr from 'ytsr';
import ytpl from 'ytpl';
import { request } from 'undici';
import { env } from 'node:process';
import { buildEmbed } from '../util/builders.js';
import { GuildChatCommandInfo, GuildAutocompleteInfo, GuildChatCommand } from '../util/interfaces.js';
import { resolve } from '../util/ytdl.js';
import { QueueItem } from '../voice/queue-manager.js';

interface SpotifyResponse {
  readonly name: string;
  readonly external_urls: { readonly spotify: string };
  readonly images: readonly { readonly url: string }[];
  readonly tracks: {
    readonly items: {
      readonly track: {
        readonly name: string;
        readonly artists: {
          readonly name: string;
        }[];
      };
    }[];
  };
}

async function spotify(info: GuildChatCommandInfo, voiceChannel: VoiceChannel): Promise<InteractionReplyOptions> {
  const token = (
    (await (
      await request('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${env.SPOTIFY_TOKEN}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      })
    ).body.json()) as { access_token: string }
  ).access_token;

  let response: SpotifyResponse;
  try {
    response = (await (
      await request(
        `https://api.spotify.com/v1/playlists/${
          /^(?:https?:\/\/)?(?:www\.)?open\.spotify\.com\/playlist\/([A-Za-z\d-_]+)$/.exec(info.interaction.options.getString('name'))[1]
        }`,
        { method: 'GET', headers: { Authorization: `Bearer ${token}` } },
      )
    ).body.json()) as SpotifyResponse;
  } catch {
    return {
      embeds: [
        buildEmbed('error', {
          title: 'Playlist not found! (Make sure it is a public playlist)',
        }),
      ],
    };
  }

  void info.interaction.editReply({
    embeds: [buildEmbed('info', { title: 'Locating Songs...' })],
  });

  const items: QueueItem[] = [];

  for (const song of response.tracks.items) {
    const term = await ytsr((await ytsr.getFilters(`${song.track.name} ${song.track.artists[0].name}`)).get('Type').get('Video').url, {
      limit: 1,
    });
    if (term.results < 1) {
      void info.interaction.channel.send({
        embeds: [
          buildEmbed('error', {
            title: `No results found for "${song.track.name}"`,
          }),
        ],
      });
      continue;
    }
    const ytvideo = term.items[0] as ytsr.Video;
    items.push({
      url: ytvideo.url,
      title: ytvideo.title,
      duration: ytvideo.duration,
      thumbnail: ytvideo.bestThumbnail.url,
    });
  }

  await info.queueManager.addToQueue(items, info.interaction.options.getInteger('position') - 1);
  await info.queueManager.connect(voiceChannel);

  return {
    embeds: [
      buildEmbed('success', {
        title: `Added "${response.name}" to queue!`,
        fields: [
          {
            name: 'URL:',
            value: response.external_urls.spotify,
          },
        ],
        image: { url: response.images[0].url },
      }),
    ],
  };
}

async function play(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
  const voiceChannel = (await info.interaction.guild.members.fetch(info.interaction.user)).voice.channel;
  if (!voiceChannel?.joinable || voiceChannel.type !== 'GUILD_VOICE') {
    return {
      content: 'This command can only be used while in a visable voice channel!',
    };
  }
  const url = info.interaction.options.getString('name').trim();

  void info.interaction.editReply({
    embeds: [buildEmbed('info', { title: 'Boiling potatoes...' })],
  });

  if (/^(?:https?:\/\/)?(?:www\.)?open\.spotify\.com\/playlist\/([A-Za-z\d-_&=?]+)$/.test(url)) {
    return spotify(info, voiceChannel);
  }

  if (/^(?:https?:\/\/)?(?:www\.)?youtube\.com\/playlist\?list=([A-Za-z\d-_&=?]+)$/.test(url)) {
    const results = await ytpl(url).catch((): false => {
      void info.interaction.editReply({
        embeds: [
          buildEmbed('error', {
            title: 'Please enter a valid url (private playlists will not work)',
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
          fields: [{ name: 'URL:', value: url }],
          image: { url: results.bestThumbnail.url },
        }),
      ],
    };
  }

  if (/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([A-Za-z\d-_&=?]+)$/.test(url)) {
    const result = await resolve(url);
    if (!result.success) {
      return {
        embeds: [buildEmbed('error', { title: 'Not a valid url!' })],
      };
    }
    const hour = Math.floor(result.duration / 3600);
    const min = Math.floor((result.duration % 3600) / 60);
    const sec = result.duration % 60;
    await info.queueManager.addToQueue(
      [
        {
          url: result.webpage_url,
          title: result.title,
          duration: `${hour > 0 ? (hour < 10 ? `0${hour}:` : `${hour}:`) : ''}${min < 10 ? `0${min}` : min}:${sec < 10 ? `0${sec}` : sec}`,
          thumbnail: result.thumbnail,
        },
      ],
      info.interaction.options.getInteger('position') - 1,
    );
    await info.queueManager.connect(voiceChannel);
    return {
      embeds: [
        buildEmbed('success', {
          title: `Added "${result.title}" to queue!`,
          fields: [{ name: 'URL:', value: result.webpage_url }],
          image: { url: result.thumbnail },
        }),
      ],
    };
  }

  const term = await ytsr((await ytsr.getFilters(url)).get('Type').get('Video').url, {
    limit: 1,
  });
  if (term.results < 1) {
    return {
      embeds: [buildEmbed('error', { title: `No results found for "${url}"` })],
    };
  }
  const result = term.items[0] as ytsr.Video;
  await info.queueManager.addToQueue(
    [
      {
        url: result.url,
        title: result.title,
        duration: result.duration,
        thumbnail: result.bestThumbnail.url,
      },
    ],
    info.interaction.options.getInteger('position') - 1,
  );
  await info.queueManager.connect(voiceChannel);
  return {
    embeds: [
      buildEmbed('success', {
        title: `Added "${result.title}" to queue!`,
        fields: [{ name: 'URL:', value: result.url }],
        image: { url: result.bestThumbnail.url },
      }),
    ],
  };
}

async function search(info: GuildAutocompleteInfo): Promise<ApplicationCommandOptionChoice[]> {
  if (
    (info.option.value as string).length < 3 ||
    /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([A-Za-z\d-_&=?]+)$/.test(
      info.option.value as string,
    ) ||
    /^(?:https?:\/\/)?(?:www\.)?open\.spotify\.com\/playlist\/([A-Za-z\d-_&=?]+)$/.test(info.option.value as string)
  )
    return;
  const results = await ytsr((await ytsr.getFilters(info.option.value as string)).get('Type').get('Video').url, {
    limit: 4,
  });
  const options = results.items.map((result: ytsr.Video) => {
    return {
      name: result.title,
      value: result.url,
    };
  });
  return options;
}

export const command: GuildChatCommand = {
  data: {
    name: 'play',
    description: 'Play a song',
    options: [
      {
        name: 'name',
        description: 'The URL or title of the song',
        type: 3,
        required: true,
        autocomplete: true,
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
  respond: play,
  autocomplete: search,
  ephemeral: true,
  type: 'Guild',
};
