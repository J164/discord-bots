import { ApplicationCommandOptionType } from 'discord.js';
import { type PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, responseOptions } from '../../util/builders.js';

export const command: PotatoChatCommand<'Global'> = {
	data: {
		name: 'roll',
		description: 'Roll a die',
		options: [
			{
				name: 'sides',
				description: 'How many sides on the die (defaults to 6)',
				type: ApplicationCommandOptionType.Integer,
				minValue: 2,
				required: false,
			},
		],
	},
	async respond(response) {
		const dice = response.interaction.options.getInteger('sides') ?? 6;
		await response.interaction.editReply(
			responseOptions(EmbedType.Info, `${dice}-sided die result`, {
				fields: [
					{
						name: `${Math.floor(Math.random() * (dice - 1) + 1)}`,
						value: `The chance of getting this result is about ${(100 / dice).toPrecision(4)}%`,
					},
				],
			}),
		);
	},
	type: 'Global',
};
