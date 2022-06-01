import { ApplicationCommandOptionType, InteractionReplyOptions } from 'discord.js';
import config from '../config.json' assert { type: 'json' };
import { ChatCommand, GlobalChatCommandInfo } from '../potato-client.js';
import { responseOptions } from '../util/builders.js';

async function report(info: GlobalChatCommandInfo): Promise<InteractionReplyOptions> {
  await (
    await info.response.client.users.fetch(config.ADMIN)
  ).send(
    responseOptions('info', {
      title: 'Error Report:',
      fields: [{ name: 'Problem Description:', value: info.response.interaction.options.getString('description', true) }],
    }),
  );
  return responseOptions('success', { title: 'Thank you for reporting the problem!' });
}

export const command: ChatCommand<'Global'> = {
  data: {
    name: 'report',
    description: 'Report a problem with Potato Bot',
    options: [
      {
        name: 'description',
        description: 'A brief description of the problem',
        type: ApplicationCommandOptionType.String,
      },
    ],
  },
  respond: report,
  type: 'Global',
};
