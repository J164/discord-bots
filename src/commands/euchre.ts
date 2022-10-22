import { ApplicationCommandOptionType, ChannelType } from 'discord.js';
import { playEuchre } from '../modules/games/euchre.js';
import type { ChatCommand } from '../types/commands.js';
import { EmbedType, responseOptions } from '../util/builders.js';

export const command: ChatCommand<'Guild'> = {
	data: {
		name: 'euchre',
		description: 'Play Euchre',
		options: [
			{
				name: 'player1',
				description: 'Player 1 (Team 1)',
				type: ApplicationCommandOptionType.User,
				required: true,
			},
			{
				name: 'player2',
				description: 'Player 2 (Team 2)',
				type: ApplicationCommandOptionType.User,
				required: true,
			},
			{
				name: 'player3',
				description: 'Player 3 (Team 3)',
				type: ApplicationCommandOptionType.User,
				required: true,
			},
			{
				name: 'player4',
				description: 'Player 4 (Team 4)',
				type: ApplicationCommandOptionType.User,
				required: true,
			},
			{
				name: 'name',
				description: 'Name of this game',
				type: ApplicationCommandOptionType.String,
				required: false,
			},
		],
	},
	async respond(response) {
		const channel = await response.interaction.guild.channels.fetch(response.interaction.channelId);
		if (!(channel?.isTextBased() && channel.type === ChannelType.GuildText)) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, 'This command can only be used in text channels'));
			return;
		}

		const playerlist = [response.interaction.options.getUser('player1', true), response.interaction.options.getUser('player2', true)];
		for (let index = 3; index <= 4; index++) {
			if (response.interaction.options.getUser(`player${index}`)) {
				playerlist.push(response.interaction.options.getUser(`player${index}`, true));
			} else {
				break;
			}
		}

		playEuchre(
			playerlist,
			await channel.threads.create({
				name: response.interaction.options.getString('name') ?? 'Euchre',
				autoArchiveDuration: 60,
			}),
		);
		await response.interaction.editReply(responseOptions(EmbedType.Success, 'Success!'));
	},
	type: 'Guild',
};
