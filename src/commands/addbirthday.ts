import { InteractionReplyOptions } from 'discord.js';
import { buildEmbed } from '../util/builders.js';
import { GlobalChatCommand, GlobalChatCommandInfo } from '../util/interfaces.js';

async function addBirthday(info: GlobalChatCommandInfo): Promise<InteractionReplyOptions> {
  const existing = (await info.database.findOne('birthdays', { id: info.interaction.user.id })) as unknown as {
    id: string;
    month: number;
    day: number;
  };
  if (
    existing &&
    existing.month === info.interaction.options.getInteger('month') &&
    existing.day === info.interaction.options.getInteger('day')
  ) {
    return { embeds: [buildEmbed('error', { title: 'Your birthday is already registered!' })] };
  }

  await info.database.deleteMany('birthdays', { id: info.interaction.user.id });
  await info.database.insertOne('birthdays', {
    id: info.interaction.user.id,
    month: info.interaction.options.getInteger('month'),
    day: info.interaction.options.getInteger('day'),
  });

  return { embeds: [buildEmbed('success', { title: 'Birthday Added!' })] };
}

export const command: GlobalChatCommand = {
  data: {
    name: 'addbirthday',
    description: 'Add your birthday to get a special message!',
    options: [
      {
        name: 'month',
        description: 'Your Birthday Month',
        type: 4,
        minValue: 1,
        maxValue: 12,
        required: true,
      },
      {
        name: 'day',
        description: 'Your Birthday',
        type: 4,
        minValue: 1,
        maxValue: 31,
        required: true,
      },
    ],
  },
  respond: addBirthday,
  type: 'Global',
};
