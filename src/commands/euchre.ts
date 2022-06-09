import { ApplicationCommandOptionType, ChannelType, InteractionReplyOptions } from 'discord.js';
import { playEuchre } from '../modules/games/euchre.js';
import { ChatCommand, GuildChatCommandInfo } from '../potato-client.js';
import { responseOptions } from '../util/builders.js';

async function euchre(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
  const channel = await info.response.interaction.guild.channels.fetch(info.response.interaction.channelId);
  if (!(channel?.isTextBased() && channel.type === ChannelType.GuildText)) {
    return responseOptions('error', { title: 'This command can only be used in text channels' });
  }
  const playerlist = [info.response.interaction.options.getUser('player1', true), info.response.interaction.options.getUser('player2', true)];
  for (let index = 3; index <= 4; index++) {
    if (info.response.interaction.options.getUser(`player${index}`)) {
      playerlist.push(info.response.interaction.options.getUser(`player${index}`)!);
    } else {
      break;
    }
  }
  playEuchre(
    playerlist,
    await channel.threads.create({
      name: info.response.interaction.options.getString('name') ?? 'Euchre',
      autoArchiveDuration: 60,
    }),
  );
  return responseOptions('success', { title: 'Success!' });
}

export const command: ChatCommand<'Guild'> = {
  data: {
    name: 'euchre',
    description: 'Play Euchre',
    options: [
      {
        name: 'player1',
        description: 'Player 1 (Team 1)',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: 'player2',
        description: 'Player 2 (Team 2)',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: 'player3',
        description: 'Player 3 (Team 3)',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: 'player4',
        description: 'Player 4 (Team 4)',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: 'name',
        description: 'Name of this game',
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },
  respond: euchre,
  type: 'Guild',
};
