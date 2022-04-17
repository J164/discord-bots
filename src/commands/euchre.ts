import { InteractionReplyOptions, TextChannel } from 'discord.js';
import { playEuchre } from '../modules/games/euchre.js';
import { buildEmbed } from '../util/builders.js';
import { GuildChatCommandInfo, GuildChatCommand } from '../util/interfaces.js';

async function euchre(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
  const channel = (await info.interaction.guild.channels.fetch(info.interaction.channelId)) as TextChannel;
  const playerlist = [info.interaction.options.getUser('player1'), info.interaction.options.getUser('player2')];
  for (let index = 3; index <= 4; index++) {
    if (info.interaction.options.getUser(`player${index}`)) {
      playerlist.push(info.interaction.options.getUser(`player${index}`));
    } else {
      break;
    }
  }
  playEuchre(
    playerlist,
    await channel.threads.create({
      name: info.interaction.options.getString('name') ?? 'Euchre',
      autoArchiveDuration: 60,
    }),
  );
  return { embeds: [buildEmbed('success', { title: 'Success!' })] };
}

export const command: GuildChatCommand = {
  data: {
    name: 'euchre',
    description: 'Play Euchre',
    options: [
      {
        name: 'player1',
        description: 'Player 1 (Team 1)',
        type: 6,
        required: true,
      },
      {
        name: 'player2',
        description: 'Player 2 (Team 2)',
        type: 6,
        required: true,
      },
      {
        name: 'player3',
        description: 'Player 3 (Team 3)',
        type: 6,
        required: true,
      },
      {
        name: 'player4',
        description: 'Player 4 (Team 4)',
        type: 6,
        required: true,
      },
      {
        name: 'name',
        description: 'Name of this game',
        type: 3,
        required: false,
      },
    ],
  },
  respond: euchre,
  type: 'Guild',
};
