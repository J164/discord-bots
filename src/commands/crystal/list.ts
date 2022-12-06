import { readdir } from 'node:fs/promises';
import {
	type ButtonBuilder,
	type ButtonInteraction,
	type EmbedBuilder,
	ActionRowBuilder,
	ApplicationCommandOptionType,
	ButtonStyle,
	ComponentType,
} from 'discord.js';
import { EmbedType, messageOptions, responseEmbed } from '../../util/builders.js';
import { type CrystalChatCommand } from '../../types/bot-types/crystal.js';
import { type GlobalChatCommandResponse } from '../../types/client.js';

function songEmbed(songs: string[], index: number): EmbedBuilder {
	const embed = responseEmbed(EmbedType.Info, 'Naruto Songs', {
		footer: { text: `${index + 1}/${Math.ceil(songs.length / 25)}` },
		fields: [],
	});
	for (let r = 0 + index * 25; r < 25 + index * 25; r++) {
		if (r >= songs.length) {
			break;
		}

		embed.addFields({ name: `${r + 1}:`, value: songs[r] });
	}

	return embed;
}

async function updateResponse(response: GlobalChatCommandResponse, songs: string[], index = 0, component?: ButtonInteraction): Promise<void> {
	const reply = messageOptions({
		embeds: [songEmbed(songs, index)],
		components: [
			new ActionRowBuilder<ButtonBuilder>({
				components: [
					{
						type: ComponentType.Button,
						custom_id: 'list-doublearrowleft',
						emoji: { name: '\u23EA' },
						label: 'Return to Beginning',
						style: ButtonStyle.Secondary,
						disabled: index === 0,
					},
					{
						type: ComponentType.Button,
						custom_id: 'list-arrowleft',
						emoji: { name: '\u2B05\uFE0F' },
						label: 'Previous Page',
						style: ButtonStyle.Secondary,
						disabled: index === 0,
					},
					{
						type: ComponentType.Button,
						custom_id: 'list-arrowright',
						emoji: { name: '\u27A1\uFE0F' },
						label: 'Next Page',
						style: ButtonStyle.Secondary,
						disabled: index === Math.ceil(songs.length / 25) - 1,
					},
					{
						type: ComponentType.Button,
						custom_id: 'list-doublearrowright',
						emoji: { name: '\u23E9' },
						label: 'Jump to End',
						style: ButtonStyle.Secondary,
						disabled: index === Math.ceil(songs.length / 25) - 1,
					},
				],
			}),
		],
	});

	await (component ? component.update(reply) : response.interaction.editReply(reply));
	await promptUser(response, songs, index);
}

async function promptUser(response: GlobalChatCommandResponse, songs: string[], index: number): Promise<void> {
	let component;
	try {
		component = await response.awaitMessageComponent({
			filter: (b) => b.user.id === response.interaction.user.id,
			time: 300_000,
			componentType: ComponentType.Button,
		});
	} catch {
		await response.interaction.editReply(messageOptions({ components: [] }));
		return;
	}

	switch (component.customId) {
		case 'list-doublearrowleft': {
			await updateResponse(response, songs, 0, component);
			break;
		}

		case 'list-arrowleft': {
			await updateResponse(response, songs, index - 1, component);
			break;
		}

		case 'list-arrowright': {
			await updateResponse(response, songs, index + 1, component);
			break;
		}

		case 'list-doublearrowright': {
			await updateResponse(response, songs, songs.length - 1, component);
			break;
		}
	}
}

export const command: CrystalChatCommand<'Global'> = {
	data: {
		name: 'list',
		description: 'List songs from an available OSt',
		options: [
			{
				name: 'naruto',
				description: 'List songs from the Naruto OST',
				type: ApplicationCommandOptionType.Subcommand,
			},
			{
				name: 'death_note',
				description: 'List songs from the Death Note OST',
				type: ApplicationCommandOptionType.Subcommand,
			},
			{
				name: 'subnautica',
				description: 'List songs from the Subnautica OST',
				type: ApplicationCommandOptionType.Subcommand,
			},
			{
				name: 'hollow_knight',
				description: 'List songs from the Hollow Knight OST',
				type: ApplicationCommandOptionType.Subcommand,
			},
		],
	},
	async respond(response) {
		const songDir = await readdir(`./music_files/ost/${response.interaction.options.getSubcommand()}_ost`);
		const songs = songDir.map((value) => {
			return value.split('.').slice(0, -1).join('.');
		});

		await updateResponse(response, songs);
	},
	ephemeral: true,
	type: 'Global',
};
