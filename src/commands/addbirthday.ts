import type { InteractionReplyOptions } from 'discord.js';
import { ApplicationCommandOptionType } from 'discord.js';
import type { GlobalChatCommandInfo, ChatCommand } from '../types/commands.js';
import { responseOptions } from '../util/builders.js';

async function addBirthday(globalInfo: GlobalChatCommandInfo<'Global'>): Promise<InteractionReplyOptions> {
	const existing = (await globalInfo.database.collection('birthdays').findOne({ id: globalInfo.response.interaction.user.id })) as unknown as {
		id: string;
		month: number;
		day: number;
	};
	if (
		existing &&
		existing.month === globalInfo.response.interaction.options.getInteger('month') &&
		existing.day === globalInfo.response.interaction.options.getInteger('day')
	) {
		return responseOptions('error', { title: 'Your birthday is already registered!' });
	}

	await globalInfo.database.collection('birthdays').deleteMany({ id: globalInfo.response.interaction.user.id });
	await globalInfo.database.collection('birthdays').insertOne({
		id: globalInfo.response.interaction.user.id,
		month: globalInfo.response.interaction.options.getInteger('month'),
		day: globalInfo.response.interaction.options.getInteger('day'),
	});

	return responseOptions('success', { title: 'Birthday Added!' });
}

export const command: ChatCommand<'Global'> = {
	data: {
		name: 'addbirthday',
		description: 'Add your birthday to get a special message!',
		options: [
			{
				name: 'month',
				description: 'Your Birthday Month',
				type: ApplicationCommandOptionType.Integer,
				minValue: 1,
				maxValue: 12,
				required: true,
			},
			{
				name: 'day',
				description: 'Your Birthday',
				type: ApplicationCommandOptionType.Integer,
				minValue: 1,
				maxValue: 31,
				required: true,
			},
		],
	},
	respond: addBirthday,
	type: 'Global',
};
