import { ApplicationCommandOptionType } from 'discord.js';
import { type PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, responseOptions } from '../../util/builders.js';
import { search } from '../../util/search.js';

export const command: PotatoChatCommand<'Guild'> = {
	data: {
		name: 'skip-to',
		description: 'Pulls the selected song to the top of the queue and skips the current song',
		options: [
			{
				name: 'position',
				description: 'Skip to a song based on its position in the queue',
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: 'index',
						description: 'The position of the song to skip to',
						type: ApplicationCommandOptionType.Integer,
						minValue: 1,
						required: true,
					},
				],
			},
			{
				name: 'name',
				description: 'Skip to the first instance of a song based on its name',
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: 'title',
						description: 'The name of the song to skip to',
						type: ApplicationCommandOptionType.String,
						required: true,
						autocomplete: true,
					},
				],
			},
		],
	},
	async respond(response, guildInfo) {
		const queue = guildInfo.queueManager?.queue.slice(1) ?? [];
		if (queue?.length === 0) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, 'The queue is empty!'));
			return;
		}

		if (
			guildInfo.queueManager?.skipTo(
				response.interaction.options.getInteger('index') ??
					search(
						queue.map((item) => {
							return item.title;
						}),
						response.interaction.options.getString('title', true),
					)[0].index,
			)
		) {
			await response.interaction.editReply(responseOptions(EmbedType.Success, 'Success!'));
			return;
		}

		await response.interaction.editReply(responseOptions(EmbedType.Error, "Couldn't skip to the song in that position!"));
	},
	async autocomplete(interaction, guildInfo) {
		const value = interaction.options.getFocused();
		if (value.length < 3) {
			await interaction.respond([]);
			return;
		}

		const queue = guildInfo.queueManager?.queue.slice(1) ?? [];

		await interaction.respond(
			search(
				queue.map((item) => {
					return item.title;
				}),
				value,
			).map((result) => {
				return {
					name: result.item,
					value: result.item,
				};
			}),
		);
	},
	type: 'Guild',
};
