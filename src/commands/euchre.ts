import type { InteractionReplyOptions } from 'discord.js';
import { ApplicationCommandOptionType, ChannelType } from 'discord.js';
import { playEuchre } from '../modules/games/euchre.js';
import type { ChatCommand, GlobalChatCommandInfo } from '../types/commands.js';
import { responseOptions } from '../util/builders.js';

async function euchre(globalInfo: GlobalChatCommandInfo<'Guild'>): Promise<InteractionReplyOptions> {
	const channel = await globalInfo.response.interaction.guild.channels.fetch(globalInfo.response.interaction.channelId);
	if (!(channel?.isTextBased() && channel.type === ChannelType.GuildText)) {
		return responseOptions('error', { title: 'This command can only be used in text channels' });
	}

	const playerlist = [globalInfo.response.interaction.options.getUser('player1', true), globalInfo.response.interaction.options.getUser('player2', true)];
	for (let index = 3; index <= 4; index++) {
		if (globalInfo.response.interaction.options.getUser(`player${index}`)) {
			playerlist.push(globalInfo.response.interaction.options.getUser(`player${index}`, true));
		} else {
			break;
		}
	}

	playEuchre(
		playerlist,
		await channel.threads.create({
			name: globalInfo.response.interaction.options.getString('name') ?? 'Euchre',
			autoArchiveDuration: 60,
		}),
	);
	return responseOptions('success', { title: 'Success!' });
}

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
	respond: euchre,
	type: 'Guild',
};
