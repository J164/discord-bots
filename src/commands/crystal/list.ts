import { APIEmbed, ApplicationCommandOptionType, ButtonStyle, ComponentType, InteractionReplyOptions, InteractionUpdateOptions } from 'discord.js';
import { readdirSync } from 'node:fs';
import { ChatCommand, GlobalChatCommandInfo } from '../../bot-client.js';
import config from '../../config.json' assert { type: 'json' };
import { responseEmbed } from '../../utils/builders.js';

function songEmbed(songs: string[], index: number): APIEmbed {
  const embed = responseEmbed('info', {
    title: 'Naruto Songs',
    footer: { text: `${index + 1}/${Math.ceil(songs.length / 25)}` },
    fields: [],
  });
  for (let r = 0 + index * 25; r < 25 + index * 25; r++) {
    if (r >= songs.length) {
      break;
    }
    embed.fields!.push({ name: `${r + 1}:`, value: songs[r] });
  }
  return embed;
}

function response(info: GlobalChatCommandInfo, songs: string[], index: number): InteractionUpdateOptions & InteractionReplyOptions {
  void prompt(info, songs, index);
  return {
    embeds: [songEmbed(songs, index)],
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            custom_id: 'list-doublearrowleft',
            emoji: { name: '\u23EA' },
            label: 'Return to Beginning',
            style: ButtonStyle.Secondary,
            disabled: index === 0,
          },
          {
            type: ComponentType.Button,
            custom_id: 'list-arrowleft',
            emoji: { name: '\u2B05\uFE0F' },
            label: 'Previous Page',
            style: ButtonStyle.Secondary,
            disabled: index === 0,
          },
          {
            type: ComponentType.Button,
            custom_id: 'list-arrowright',
            emoji: { name: '\u27A1\uFE0F' },
            label: 'Next Page',
            style: ButtonStyle.Secondary,
            disabled: index === Math.ceil(songs.length / 25) - 1,
          },
          {
            type: ComponentType.Button,
            custom_id: 'list-doublearrowright',
            emoji: { name: '\u23E9' },
            label: 'Jump to End',
            style: ButtonStyle.Secondary,
            disabled: index === Math.ceil(songs.length / 25) - 1,
          },
        ],
      },
    ],
  };
}

async function prompt(info: GlobalChatCommandInfo, songs: string[], index: number): Promise<void> {
  let component;
  try {
    component = await info.response.awaitMessageComponent({
      filter: (b) => b.user.id === info.response.interaction.user.id,
      time: 300_000,
      componentType: ComponentType.Button,
    });
  } catch {
    void info.response.interaction.editReply({ components: [] }).catch();
    return;
  }

  switch (component.customId) {
    case 'list-doublearrowleft':
      void component.update(response(info, songs, 0));
      break;
    case 'list-arrowleft':
      void component.update(response(info, songs, index - 1));
      break;
    case 'list-arrowright':
      void component.update(response(info, songs, index + 1));
      break;
    case 'list-doublearrowright':
      void component.update(response(info, songs, songs.length - 1));
      break;
  }
}

function list(info: GlobalChatCommandInfo): void {
  const songs = readdirSync(`${config.DATA}/music_files/${info.response.interaction.options.getSubcommand()}_ost`).map((value) => {
    return value.split('.').slice(0, -1).join('.');
  });
  void info.response.interaction.editReply(response(info, songs, 0));
}

export const command: ChatCommand<'Global'> = {
  data: {
    name: 'list',
    description: 'List songs from an available OSt',
    options: [
      {
        name: 'naruto',
        description: 'List songs from the Naruto OST',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'death_note',
        description: 'List songs from the Death Note OST',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'subnautica',
        description: 'List songs from the Subnautica OST',
        type: ApplicationCommandOptionType.Subcommand,
      },
      {
        name: 'hollow_knight',
        description: 'List songs from the Hollow Knight OST',
        type: ApplicationCommandOptionType.Subcommand,
      },
    ],
  },
  respond: list,
  ephemeral: true,
  type: 'Global',
};
