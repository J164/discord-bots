import { ApplicationCommandOptionType } from 'discord.js';
import { type PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, responseOptions } from '../../util/builders.js';

export const command: PotatoChatCommand<'Global'> = {
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
	async respond(response, globalInfo) {
		const existing = (await globalInfo.database.collection('birthdays').findOne({ id: response.interaction.user.id })) as unknown as {
			id: string;
			month: number;
			day: number;
		};
		if (existing && existing.month === response.interaction.options.getInteger('month') && existing.day === response.interaction.options.getInteger('day')) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, 'Your birthday is already registered!'));
			return;
		}

		await globalInfo.database.collection('birthdays').deleteMany({ id: response.interaction.user.id });
		await globalInfo.database.collection('birthdays').insertOne({
			id: response.interaction.user.id,
			month: response.interaction.options.getInteger('month'),
			day: response.interaction.options.getInteger('day'),
		});

		await response.interaction.editReply(responseOptions(EmbedType.Success, 'Birthday Added!'));
	},
	type: 'Global',
};
