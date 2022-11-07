import { ApplicationCommandOptionType, ChannelType } from 'discord.js';
import { playMagic } from '../../modules/games/magic-game.js';
import type { PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, responseOptions } from '../../util/builders.js';

export const command: PotatoChatCommand<'Guild'> = {
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

		const playerList = [response.interaction.options.getUser('player1', true), response.interaction.options.getUser('player2', true)];
		for (let index = 3; index <= 4; index++) {
			if (response.interaction.options.getUser(`player${index}`)) {
				playerList.push(response.interaction.options.getUser(`player${index}`, true));
			} else {
				break;
			}
		}

		await response.interaction.editReply(responseOptions(EmbedType.Success, 'Starting game!'));

		await playMagic(
			playerList.map((user) => {
				return {
					id: user.id,
					name: user.username,
					life: response.interaction.options.getInteger('life') ?? 20,
					poison: 0,
					isAlive: true,
					commanderDamage: [0, 0, 0, 0],
				};
			}),
			await channel.threads.create({
				name: response.interaction.options.getString('name') ?? 'Magic',
				autoArchiveDuration: 60,
			}),
		);
	},
	type: 'Guild',
};
