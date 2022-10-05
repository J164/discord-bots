import type { ApplicationCommandOptionChoiceData, InteractionReplyOptions } from 'discord.js';
import { ApplicationCommandOptionType } from 'discord.js';
import type { ChatCommand, GlobalAutocompleteInfo, GlobalChatCommandInfo, GuildInfo } from '../types/commands.js';
import { responseOptions } from '../util/builders.js';

function skipto(globalInfo: GlobalChatCommandInfo<'Guild'>, guildInfo: GuildInfo): InteractionReplyOptions {
	if (guildInfo.queueManager?.skipTo(globalInfo.response.interaction.options.getInteger('index', true))) {
		return responseOptions('success', {
			title: 'Success!',
		});
	}

	return responseOptions('error', {
		title: "Couldn't skip to the song in that position!",
	});
}

function suggestions(globalInfo: GlobalAutocompleteInfo, guildInfo: GuildInfo): ApplicationCommandOptionChoiceData[] {
	const value = Number.parseInt(globalInfo.interaction.options.getFocused(), 10);
	if (Number.isNaN(value)) return [];

	const items = guildInfo.queueManager?.queue.slice(value > 3 ? value - 3 : 0, value < guildInfo.queueManager.queue.length - 1 ? value + 1 : undefined);

	return (
		items?.map((item, index) => {
			const location = value > 3 ? value - 3 + index : index;
			return {
				name: `${location}: ${item.title}`,
				value: location,
			};
		}) ?? []
	);
}

export const command: ChatCommand<'Guild'> = {
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
	respond: skipto,
	autocomplete: suggestions,
	type: 'Guild',
};
