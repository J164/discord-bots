import { ApplicationCommandOptionChoice, InteractionReplyOptions } from 'discord.js';
import { buildEmbed } from '../util/builders.js';
import { GuildChatCommandInfo, GuildAutocompleteInfo, GuildChatCommand } from '../util/interfaces.js';

async function skipto(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
  await info.queueManager.skipTo({
    index: info.interaction.options.getInteger('index'),
    title: info.interaction.options.getString('title'),
  });
  return { embeds: [buildEmbed('success', { title: 'Success!' })] };
}

function suggestions(info: GuildAutocompleteInfo): ApplicationCommandOptionChoice[] {
  const results = info.queueManager.searchQueue(info.option.value as string);
  const options: ApplicationCommandOptionChoice[] = [];
  for (const result of results) {
    if (options.length > 3) {
      break;
    }
    options.push({ name: result.item.title, value: result.item.title });
  }
  return options;
}

export const command: GuildChatCommand = {
  data: {
    name: 'skipto',
    description: 'Pulls the selected song to the top of the queue and skips the current song',
    options: [
      {
        name: 'position',
        description: 'Skip to a song based on its position in the queue',
        type: 1,
        options: [
          {
            name: 'index',
            description: 'The position of the song to skip to',
            type: 4,
            minValue: 1,
            required: true,
          },
        ],
      },
      {
        name: 'name',
        description: 'Skip to the first instance of a song based on its name',
        type: 1,
        options: [
          {
            name: 'title',
            description: 'The name of the song to skip to',
            type: 3,
            required: true,
            autocomplete: true,
          },
        ],
      },
    ],
  },
  respond: skipto,
  autocomplete: suggestions,
  type: 'Guild',
};
