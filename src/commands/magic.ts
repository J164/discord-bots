import { InteractionReplyOptions, User } from 'discord.js';
import { playMagic } from '../modules/games/magic-game.js';
import { buildEmbed } from '../util/builders.js';
import { GuildChatCommandInfo, GuildChatCommand } from '../util/interfaces.js';

async function magic(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
  const channel = await info.interaction.guild.channels.fetch(info.interaction.channelId);
  if (!channel.isText()) {
    return {
      embeds: [buildEmbed('error', { title: 'Something went wrong!' })],
    };
  }
  const playerlist: User[] = [];
  for (let index = 1; index <= 4; index++) {
    if (info.interaction.options.getUser(`player${index}`)) {
      playerlist.push(info.interaction.options.getUser(`player${index}`));
    } else {
      break;
    }
  }
  playMagic(
    playerlist,
    info.interaction.options.getInteger('life') ?? 20,
    await channel.threads.create({
      name: info.interaction.options.getString('name') ?? 'Magic',
      autoArchiveDuration: 60,
    }),
  );
  return { embeds: [buildEmbed('success', { title: 'Success!' })] };
}

export const command: GuildChatCommand = {
  data: {
    name: 'magic',
    description: 'Start a game of Magic: The Gathering',
    options: [
      {
        name: 'player1',
        description: 'Player 1',
        type: 6,
        required: true,
      },
      {
        name: 'player2',
        description: 'Player 2',
        type: 6,
        required: true,
      },
      {
        name: 'player3',
        description: 'Player 3',
        type: 6,
        required: false,
      },
      {
        name: 'player4',
        description: 'Player 4',
        type: 6,
        required: false,
      },
      {
        name: 'life',
        description: 'Starting life total',
        type: 4,
        minValue: 1,
        required: false,
      },
      {
        name: 'name',
        description: 'Name of the game',
        type: 3,
        required: false,
      },
    ],
  },
  respond: magic,
  type: 'Guild',
};
