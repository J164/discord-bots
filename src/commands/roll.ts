import { InteractionReplyOptions } from 'discord.js';
import { buildEmbed } from '../util/builders.js';
import { GlobalChatCommandInfo, GlobalChatCommand } from '../util/interfaces.js';

function roll(info: GlobalChatCommandInfo): InteractionReplyOptions {
  const dice = info.interaction.options.getInteger('sides') ?? 6;
  return {
    embeds: [
      buildEmbed('info', {
        title: `${dice}-sided die result`,
        fields: [
          {
            name: `${Math.floor(Math.random() * (dice - 1) + 1)}`,
            value: `The chance of getting this result is about ${(100 / dice).toPrecision(4)}%`,
          },
        ],
      }),
    ],
  };
}

export const command: GlobalChatCommand = {
  data: {
    name: 'roll',
    description: 'Roll a die',
    options: [
      {
        name: 'sides',
        description: 'How many sides on the die (defaults to 6)',
        type: 4,
        minValue: 2,
        required: false,
      },
    ],
  },
  respond: roll,
  type: 'Global',
};
