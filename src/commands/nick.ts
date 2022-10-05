import type { InteractionReplyOptions } from 'discord.js';
import { ApplicationCommandOptionType } from 'discord.js';
import type { ChatCommand, GlobalChatCommandInfo } from '../types/commands.js';
import { responseOptions } from '../util/builders.js';

async function nick(globalInfo: GlobalChatCommandInfo<'Guild'>): Promise<InteractionReplyOptions> {
	const member = await globalInfo.response.interaction.guild.members.fetch(globalInfo.response.interaction.options.getUser('member', true));
	if (globalInfo.response.interaction.options.getString('nickname') && globalInfo.response.interaction.options.getString('nickname', true).length > 32) {
		return responseOptions('error', {
			title: 'Nicknames must be 32 characters or less',
		});
	}

	if (!member.manageable) {
		return responseOptions('error', {
			title: "This user's permissions are too powerful to perform this action!",
		});
	}

	await member.setNickname(globalInfo.response.interaction.options.getString('nickname'));
	return responseOptions('success', { title: 'Success!' });
}

export const command: ChatCommand<'Guild'> = {
	data: {
		name: 'nick',
		description: 'Change the nickname of a server member',
		options: [
			{
				name: 'member',
				description: 'The member whose nickname will change',
				type: ApplicationCommandOptionType.User,
				required: true,
			},
			{
				name: 'nickname',
				description: "The member's new nickname (32 character limit)",
				type: ApplicationCommandOptionType.String,
				required: false,
			},
		],
	},
	respond: nick,
	type: 'Guild',
};
