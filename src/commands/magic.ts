import { ApplicationCommandOptionType, ChannelType, InteractionReplyOptions } from 'discord.js';
import { playMagic } from '../modules/games/magic-game.js';
import { ChatCommand, GuildChatCommandInfo } from '../potato-client.js';
import { responseOptions } from '../util/builders.js';

async function magic(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
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
  playMagic(
    playerlist,
    info.response.interaction.options.getInteger('life') ?? 20,
    await channel.threads.create({
      name: info.response.interaction.options.getString('name') ?? 'Magic',
      autoArchiveDuration: 60,
    }),
  );
  return responseOptions('success', { title: 'Success!' });
}

export const command: ChatCommand<'Guild'> = {
  data: {
    name: 'magic',
    description: 'Start a game of Magic: The Gathering',
    options: [
      {
        name: 'player1',
        description: 'Player 1',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: 'player2',
        description: 'Player 2',
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: 'player3',
        description: 'Player 3',
        type: ApplicationCommandOptionType.User,
        required: false,
      },
      {
        name: 'player4',
        description: 'Player 4',
        type: ApplicationCommandOptionType.User,
        required: false,
      },
      {
        name: 'life',
        description: 'Starting life total',
        type: ApplicationCommandOptionType.Integer,
        minValue: 1,
        required: false,
      },
      {
        name: 'name',
        description: 'Name of the game',
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },
  respond: magic,
  type: 'Guild',
};
