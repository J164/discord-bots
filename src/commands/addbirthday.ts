import { ApplicationCommandOptionType, InteractionReplyOptions } from 'discord.js';
import { GlobalChatCommandInfo, ChatCommand } from '../index.js';
import { responseOptions } from '../util/builders.js';

async function addBirthday(info: GlobalChatCommandInfo): Promise<InteractionReplyOptions> {
  const existing = (await info.database.collection('birthdays').findOne({ id: info.response.interaction.user.id })) as unknown as {
    id: string;
    month: number;
    day: number;
  };
  if (
    existing &&
    existing.month === info.response.interaction.options.getInteger('month') &&
    existing.day === info.response.interaction.options.getInteger('day')
  ) {
    return responseOptions('error', { title: 'Your birthday is already registered!' });
  }

  await info.database.collection('birthdays').deleteMany({ id: info.response.interaction.user.id });
  await info.database.collection('birthdays').insertOne({
    id: info.response.interaction.user.id,
    month: info.response.interaction.options.getInteger('month'),
    day: info.response.interaction.options.getInteger('day'),
  });

  return responseOptions('success', { title: 'Birthday Added!' });
}

export const command: ChatCommand<'Global'> = {
  data: {
    name: 'addbirthday',
    description: 'Add your birthday to get a special message!',
    options: [
      {
        name: 'month',
        description: 'Your Birthday Month',
        type: ApplicationCommandOptionType.Integer,
        minValue: 1,
        maxValue: 12,
        required: true,
      },
      {
        name: 'day',
        description: 'Your Birthday',
        type: ApplicationCommandOptionType.Integer,
        minValue: 1,
        maxValue: 31,
        required: true,
      },
    ],
  },
  respond: addBirthday,
  type: 'Global',
};
