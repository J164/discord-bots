import type { InteractionReplyOptions } from 'discord.js';
import { ApplicationCommandOptionType } from 'discord.js';
import type { ChatCommand, GlobalChatCommandInfo } from '../types/commands.js';
import { responseOptions } from '../util/builders.js';

function roll(globalInfo: GlobalChatCommandInfo<'Global'>): InteractionReplyOptions {
	const dice = globalInfo.response.interaction.options.getInteger('sides') ?? 6;
	return responseOptions('info', {
		title: `${dice}-sided die result`,
		fields: [
			{
				name: `${Math.floor(Math.random() * (dice - 1) + 1)}`,
				value: `The chance of getting this result is about ${(100 / dice).toPrecision(4)}%`,
			},
		],
	});
}

export const command: ChatCommand<'Global'> = {
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
	respond: roll,
	type: 'Global',
};
