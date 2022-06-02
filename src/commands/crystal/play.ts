import { ApplicationCommandOptionChoiceData, ApplicationCommandOptionType, ChannelType, InteractionReplyOptions } from 'discord.js';
import Fuse from 'fuse.js';
import { readdirSync } from 'node:fs';
import { ChatCommand, GuildAutocompleteInfo, GuildChatCommandInfo } from '../../bot-client.js';
import config from '../../config.json' assert { type: 'json' };
import { responseOptions } from '../../utils/builders.js';

async function play(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
  const voiceChannel = info.response.interaction.channel?.isVoice() ? info.response.interaction.channel : info.response.interaction.member.voice.channel;
  if (!voiceChannel?.joinable || voiceChannel.type !== ChannelType.GuildVoice) {
    return responseOptions('error', { title: 'This command can only be used while in a visable voice channel!' });
  }

  const path = `${config.DATA}/music_files/${info.response.interaction.options.getSubcommand()}_ost`;

  const songs = readdirSync(path).map((value) => {
    return value.split('.').slice(0, -1).join('.');
  });

  const results = new Fuse(songs).search(info.response.interaction.options.getString('name', true));

  await info.voiceManager!.play(voiceChannel, `${path}/${results[0].item}.webm`, info.response.interaction.options.getBoolean('loop') ?? false);
  return responseOptions('success', { title: 'Now Playing!' });
}

function search(info: GuildAutocompleteInfo): ApplicationCommandOptionChoiceData[] {
  if ((info.interaction.options.getFocused() as string).length < 3) {
    return [];
  }
  const path = `${config.DATA}/music_files/${info.interaction.options.getSubcommand(true)}_ost`;
  const songs = readdirSync(path).map((value) => {
    return value.split('.').slice(0, -1).join('.');
  });
  const results = new Fuse(songs).search(info.interaction.options.getFocused() as string);
  return results.slice(0, 25).map((result) => {
    return {
      name: result.item,
      value: result.item,
    };
  });
}

export const command: ChatCommand<'Guild'> = {
  data: {
    name: 'play',
    description: 'Play a song from the Naruto OST',
    options: [
      {
        name: 'naruto',
        description: 'Play a song from the Naruto OST',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'name',
            description: 'The name of the song',
            type: ApplicationCommandOptionType.String,
            autocomplete: true,
            required: true,
          },
          {
            name: 'loop',
            description: 'Whether to loop the song',
            type: ApplicationCommandOptionType.Boolean,
            required: false,
          },
        ],
      },
      {
        name: 'death_note',
        description: 'Play a song from the Death Note OST',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'name',
            description: 'The name of the song',
            type: ApplicationCommandOptionType.String,
            autocomplete: true,
            required: true,
          },
          {
            name: 'loop',
            description: 'Whether to loop the song',
            type: ApplicationCommandOptionType.Boolean,
            required: false,
          },
        ],
      },
      {
        name: 'subnautica',
        description: 'Play a song from the Subnautica OST',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'name',
            description: 'The name of the song',
            type: ApplicationCommandOptionType.String,
            autocomplete: true,
            required: true,
          },
          {
            name: 'loop',
            description: 'Whether to loop the song',
            type: ApplicationCommandOptionType.Boolean,
            required: false,
          },
        ],
      },
      {
        name: 'hollow_knight',
        description: 'Play a song from the Hollow Knight OST',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'name',
            description: 'The name of the song',
            type: ApplicationCommandOptionType.String,
            autocomplete: true,
            required: true,
          },
          {
            name: 'loop',
            description: 'Whether to loop the song',
            type: ApplicationCommandOptionType.Boolean,
            required: false,
          },
        ],
      },
      {
        name: 'undertale',
        description: 'Play a song from the Undertale OST',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'name',
            description: 'The name of the song',
            type: ApplicationCommandOptionType.String,
            autocomplete: true,
            required: true,
          },
          {
            name: 'loop',
            description: 'Whether to loop the song',
            type: ApplicationCommandOptionType.Boolean,
            required: false,
          },
        ],
      },
    ],
  },
  respond: play,
  autocomplete: search,
  type: 'Guild',
};
