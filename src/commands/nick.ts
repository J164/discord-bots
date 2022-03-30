import { InteractionReplyOptions } from 'discord.js';
import { buildEmbed } from '../util/builders.js';
import { GuildChatCommandInfo, GuildChatCommand } from '../util/interfaces.js';

async function nick(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
  const member = await info.interaction.guild.members.fetch(info.interaction.options.getUser('member'));
  if (info.interaction.options.getString('nickname')?.length > 32) {
    return {
      embeds: [
        buildEmbed('error', {
          title: 'Too many characters! (nicknames must be 32 characters or less)',
        }),
      ],
    };
  }
  if (!member.manageable) {
    return {
      embeds: [
        buildEmbed('error', {
          title: "This user's permissions are too powerful to perform this action!",
        }),
      ],
    };
  }
  await member.setNickname(info.interaction.options.getString('nickname'));
  return { embeds: [buildEmbed('success', { title: 'Success!' })] };
}

export const command: GuildChatCommand = {
  data: {
    name: 'nick',
    description: 'Change the nickname of a server member',
    options: [
      {
        name: 'member',
        description: 'The member whose nickname will change',
        type: 6,
        required: true,
      },
      {
        name: 'nickname',
        description: "The member's new nickname",
        type: 3,
        required: false,
      },
    ],
  },
  respond: nick,
  type: 'Guild',
};
