import { ApplicationCommandOptionType } from 'discord.js';
import { type WynncraftResponse } from '../../types/api.js';
import { type PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, responseOptions } from '../../util/builders.js';

export const command: PotatoChatCommand<'Global'> = {
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
	async respond(response) {
		const wynncraftResponse = await fetch(`https://api.wynncraft.com/v2/player/${response.interaction.options.getString('player', true)}/stats`);
		if (!wynncraftResponse.ok) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, "Couldn't find that player!"));
			return;
		}

		const playerData = (await wynncraftResponse.json()) as WynncraftResponse;

		await response.interaction.editReply(
			responseOptions(
				EmbedType.Info,
				playerData.data[0].username,
				{
					fields: [
						{
							name: 'Current Status',
							value: playerData.data[0].meta.location.online ? `Online at: ${playerData.data[0].meta.location.server}` : 'Offline',
						},
						...playerData.data[0].classes.map((profile, index) => {
							const { playtime, name, professions } = profile;
							const playHours = Math.floor(playtime / 60);
							const playMins = playtime % 60;
							return {
								name: `Profile ${index + 1}`,
								value: `Class: ${name}\nPlaytime: ${playHours < 10 ? `0${playHours}` : playHours}:${playMins < 10 ? `0${playMins}` : playMins}\nCombat Level: ${
									professions.combat.level
								}`,
							};
						}),
					],
				},
				playerData.data[0].meta.location.online ? 0x33_cc_33 : 0xff_00_00,
			),
		);
	},
	type: 'Global',
};
