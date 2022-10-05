import type { InteractionReplyOptions } from 'discord.js';
import { ApplicationCommandOptionType } from 'discord.js';
import type { ChatCommand, GlobalChatCommandInfo } from '../types/commands.js';
import { responseEmbed, responseOptions } from '../util/builders.js';

async function wynncraft(globalInfo: GlobalChatCommandInfo<'Global'>): Promise<InteractionReplyOptions> {
	const response = await fetch(`https://api.wynncraft.com/v2/player/${globalInfo.response.interaction.options.getString('player', true)}/stats`);
	if (!response.ok) {
		return responseOptions('error', { title: "Couldn't find that player!" });
	}

	const playerData = (await response.json()) as WynncraftResponse;
	const embedOptions = {
		title: playerData.data[0].username,
		fields: [
			{
				name: 'Current Status',
				value: playerData.data[0].meta.location.online ? `Online at: ${playerData.data[0].meta.location.server}` : 'Offline',
			},
		],
		color: playerData.data[0].meta.location.online ? 0x33_cc_33 : 0xff_00_00,
	};
	for (let index = 0; index < playerData.data[0].classes.length; index++) {
		const { playtime } = playerData.data[0].classes[index];
		const playHours = Math.floor(playtime / 60);
		const playSecs = playtime % 60;
		embedOptions.fields.push({
			name: `Profile ${index + 1}`,
			value: `Class: ${playerData.data[0].classes[index].name}\nPlaytime: ${playHours < 10 ? `0${playHours}` : playHours}:${
				playSecs < 10 ? `0${playSecs}` : playSecs
			}\nCombat Level: ${playerData.data[0].classes[index].professions.combat.level}`,
		});
	}

	return { embeds: [responseEmbed('info', embedOptions)] };
}

export const command: ChatCommand<'Global'> = {
	data: {
		name: 'wynncraft',
		description: 'Get stats for a player on Wynncraft',
		options: [
			{
				name: 'player',
				description: 'The username of target player',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
		],
	},
	respond: wynncraft,
	type: 'Global',
};
