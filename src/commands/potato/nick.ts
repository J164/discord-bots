import { ApplicationCommandOptionType } from 'discord.js';
import { type PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, responseOptions } from '../../util/helpers.js';

export const command: PotatoChatCommand<'Guild'> = {
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
	async respond(response) {
		const member = await response.interaction.guild.members.fetch(response.interaction.options.getUser('member', true));
		if (response.interaction.options.getString('nickname') && response.interaction.options.getString('nickname', true).length > 32) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, 'Nicknames must be 32 characters or less'));
			return;
		}

		if (!member.manageable) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, "This user's permissions are too powerful to perform this action!"));
			return;
		}

		await member.setNickname(response.interaction.options.getString('nickname'));
		await response.interaction.editReply(responseOptions(EmbedType.Success, 'Success!'));
	},
	type: 'Guild',
};
