import { InteractionReplyOptions } from 'discord.js';
import { buildEmbed } from '../util/builders.js';
import { GlobalChatCommand } from '../util/interfaces.js';

function flip(): InteractionReplyOptions {
  return {
    embeds: [
      buildEmbed('info', {
        title: 'Flip Result:',
        image: {
          url:
            Math.random() >= 0.5
              ? 'https://upload.wikimedia.org/wikipedia/commons/d/dd/2017-D_Roosevelt_dime_obverse_transparent.png'
              : 'https://upload.wikimedia.org/wikipedia/commons/d/d9/2017-D_Roosevelt_dime_reverse_transparent.png',
        },
      }),
    ],
  };
}

export const command: GlobalChatCommand = {
  data: {
    name: 'flip',
    description: 'Flip a coin',
  },
  respond: flip,
  type: 'Global',
};
