import { ApplicationCommandOptionChoiceData, ApplicationCommandOptionType, InteractionReplyOptions } from 'discord.js';
import { ChatCommand, GuildAutocompleteInfo, GuildChatCommandInfo } from '../potato-client.js';
import { responseOptions } from '../util/builders.js';

async function skipto(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
  if (await info.queueManager.skipTo((info.response.interaction.options.getInteger('index') ?? info.response.interaction.options.getString('title'))!)) {
    return responseOptions('success', {
      title: 'Success!',
    });
  }
  return responseOptions('error', {
    title: 'The queue is too small to skip to a specific song!',
  });
}

function suggestions(info: GuildAutocompleteInfo): ApplicationCommandOptionChoiceData[] {
  if ((info.option.value as string).length < 3) return [];

  return info.queueManager
    .searchQueue(info.option.value as string)
    .slice(0, 25)
    .map((result) => {
      return {
        name: result.item,
        value: result.item,
      };
    });
}

export const command: ChatCommand<'Guild'> = {
  data: {
    name: 'skipto',
    description: 'Pulls the selected song to the top of the queue and skips the current song',
    options: [
      {
        name: 'position',
        description: 'Skip to a song based on its position in the queue',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'index',
            description: 'The position of the song to skip to',
            type: ApplicationCommandOptionType.Integer,
            minValue: 1,
            required: true,
          },
        ],
      },
      {
        name: 'name',
        description: 'Skip to the first instance of a song based on its name',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'title',
            description: 'The name of the song to skip to',
            type: ApplicationCommandOptionType.String,
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
