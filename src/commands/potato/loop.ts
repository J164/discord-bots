import { ApplicationCommandOptionType } from 'discord.js';
import type { PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, responseOptions } from '../../util/builders.js';

export const command: PotatoChatCommand<'Guild'> = {
	data: {
		name: 'loop',
		description: 'Loop the current song or queue',
		options: [
			{
				name: 'current',
				description: 'Loop just the current song',
				type: ApplicationCommandOptionType.Subcommand,
			},
			{
				name: 'queue',
				description: 'Loop the entire queue',
				type: ApplicationCommandOptionType.Subcommand,
			},
		],
	},
	async respond(response, guildInfo) {
		if (response.interaction.options.getSubcommand() === 'current') {
			await response.interaction.editReply(guildInfo.queueManager?.loopSong() ?? responseOptions(EmbedType.Error, 'Nothing is playing!'));
			return;
		}

		await response.interaction.editReply(guildInfo.queueManager?.loopQueue() ?? responseOptions(EmbedType.Error, 'Nothing is queued!'));
	},
	type: 'Guild',
};
