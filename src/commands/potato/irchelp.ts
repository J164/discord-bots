import type { PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, responseOptions } from '../../util/builders.js';

export const command: PotatoChatCommand<'Global'> = {
	data: {
		name: 'irchelp',
		description: 'Get help with setting up IRC notifications',
	},
	async respond(response) {
		await response.interaction.editReply(
			responseOptions(EmbedType.Info, '<https://docs.google.com/document/d/1z9PLa5g4NRI51Eg-xpt4EKsTP5oMJ1plZ089AvUVa4g/edit?usp=sharing>'),
		);
	},
	type: 'Global',
};
