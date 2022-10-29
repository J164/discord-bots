import { ApplicationCommandOptionType, InteractionReplyOptions } from 'discord.js';
import { ChatCommand, GlobalChatCommandInfo } from '../../bot-client.js';

function yeet(info: GlobalChatCommandInfo): InteractionReplyOptions {
  return {
    content: `Y${'E'.repeat(info.response.interaction.options.getInteger('power') ?? 2)}T!`,
  };
}

export const command: ChatCommand<'Global'> = {
  data: {
    name: 'yeet',
    description: 'Ask Yeet Bot to yell YEET!',
    options: [
      {
        name: 'power',
        description: 'How powerful the yeet should be',
        type: ApplicationCommandOptionType.Integer,
        minValue: 2,
        maxValue: 1995,
        required: false,
      },
    ],
  },
  respond: yeet,
  type: 'Global',
};
