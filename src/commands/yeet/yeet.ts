import { ApplicationCommandOptionType } from 'discord.js';
import type { YeetChatCommand } from '../../types/bot-types/yeet.js';

export const command: YeetChatCommand<'Global'> = {
	data: {
		name: 'yeet',
		description: 'Ask Yeet Bot to yell YEET!',
		options: [
			{
				name: 'power',
				description: 'How powerful the yeet should be',
				type: ApplicationCommandOptionType.Integer,
				minValue: 2,
				maxValue: 1995,
				required: false,
			},
		],
	},
	async respond(response) {
		await response.interaction.editReply({
			content: `Y${'E'.repeat(response.interaction.options.getInteger('power') ?? 2)}T!`,
		});
	},
	type: 'Global',
};
