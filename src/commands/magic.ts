import { ApplicationCommandOptionType, ChannelType } from 'discord.js';
import { playMagic } from '../modules/games/magic-game.js';
import type { ChatCommand } from '../types/commands.js';
import { EmbedType, responseOptions } from '../util/builders.js';

export const command: ChatCommand<'Guild'> = {
	data: {
		name: 'magic',
		description: 'Start a game of Magic: The Gathering',
		options: [
			{
				name: 'player1',
				description: 'Player 1',
				type: ApplicationCommandOptionType.User,
				required: true,
			},
			{
				name: 'player2',
				description: 'Player 2',
				type: ApplicationCommandOptionType.User,
				required: true,
			},
			{
				name: 'player3',
				description: 'Player 3',
				type: ApplicationCommandOptionType.User,
				required: false,
			},
			{
				name: 'player4',
				description: 'Player 4',
				type: ApplicationCommandOptionType.User,
				required: false,
			},
			{
				name: 'life',
				description: 'Starting life total',
				type: ApplicationCommandOptionType.Integer,
				minValue: 1,
				required: false,
			},
			{
				name: 'name',
				description: 'Name of the game',
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

		playMagic(
			playerlist,
			response.interaction.options.getInteger('life') ?? 20,
			await channel.threads.create({
				name: response.interaction.options.getString('name') ?? 'Magic',
				autoArchiveDuration: 60,
			}),
		);
		await response.interaction.editReply(responseOptions(EmbedType.Success, 'Success!'));
	},
	type: 'Guild',
};
