import { InteractionReplyOptions } from 'discord.js';
import { request } from 'undici';
import { buildEmbed } from '../util/builders.js';
import { GlobalChatCommandInfo, GlobalChatCommand } from '../util/interfaces.js';

interface WynncraftData {
  readonly data: readonly {
    readonly username: string;
    readonly meta: {
      readonly location: {
        readonly online: boolean;
        readonly server: string;
      };
    };
    readonly classes: readonly {
      readonly name: string;
      readonly playtime: number;
      readonly professions: {
        readonly combat: {
          readonly level: number;
        };
      };
    }[];
  }[];
}

async function wynncraft(info: GlobalChatCommandInfo): Promise<InteractionReplyOptions> {
  const playerData = (await (
    await request(`https://api.wynncraft.com/v2/player/${info.interaction.options.getString('player')}/stats`)
  ).body.json()) as WynncraftData;
  const embed = buildEmbed('info', {
    title: playerData.data[0].username,
    fields: [
      {
        name: 'Current Status',
        value: playerData.data[0].meta.location.online ? `Online at: ${playerData.data[0].meta.location.server}` : 'Offline',
      },
    ],
    color: playerData.data[0].meta.location.online ? 0x33_cc_33 : 0xff_00_00,
  });
  for (let index = 0; index < playerData.data[0].classes.length; index++) {
    const playtime = playerData.data[0].classes[index].playtime;
    const playHours = Math.floor(playtime / 60);
    const playSecs = playtime % 60;
    embed.fields.push({
      name: `Profile ${index + 1}`,
      value: `Class: ${playerData.data[0].classes[index].name}\nPlaytime: ${playHours < 10 ? `0${playHours}` : playHours}:${
        playSecs < 10 ? `0${playSecs}` : playSecs
      }\nCombat Level: ${playerData.data[0].classes[index].professions.combat.level}`,
    });
  }
  return { embeds: [embed] };
}

export const command: GlobalChatCommand = {
  data: {
    name: 'wynncraft',
    description: 'Get stats for a player on Wynncraft',
    options: [
      {
        name: 'player',
        description: 'The username of target player',
        type: 3,
        required: true,
      },
    ],
  },
  respond: wynncraft,
  type: 'Global',
};
