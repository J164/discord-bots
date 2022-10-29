import { ApplicationCommandOptionType } from 'discord.js';
import type { PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, responseOptions } from '../../util/builders.js';

export const command: PotatoChatCommand<'Guild'> = {
	data: {
		name: 'skipto',
		description: 'Pulls the selected song to the top of the queue and skips the current song',
		options: [
			{
				name: 'index',
				description: 'The position of the song to skip to',
				type: ApplicationCommandOptionType.Integer,
				minValue: 1,
				required: true,
				autocomplete: true,
			},
		],
	},
	async respond(response, guildInfo) {
		if (guildInfo.queueManager?.skipTo(response.interaction.options.getInteger('index', true))) {
			await response.interaction.editReply(responseOptions(EmbedType.Success, 'Success!'));
			return;
		}

		await response.interaction.editReply(responseOptions(EmbedType.Error, "Couldn't skip to the song in that position!"));
	},
	async autocomplete(interaction, guildInfo) {
		const value = Number.parseInt(interaction.options.getFocused(), 10);
		if (Number.isNaN(value)) {
			await interaction.respond([]);
			return;
		}

		const queue = guildInfo.queueManager?.queue.slice(1) ?? [];

		const items = queue.slice(value > 3 ? value - 3 : 0, value < queue.length - 1 ? value + 1 : undefined);

		await interaction.respond(
			items?.map((item, index) => {
				const location = value > 3 ? value - 3 + index : index;
				return {
					name: `${location}: ${item.title}`,
					value: location,
				};
			}) ?? [],
		);
	},
	type: 'Guild',
};
