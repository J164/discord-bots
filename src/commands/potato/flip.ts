import { type PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, responseOptions } from '../../util/helpers.js';

export const command: PotatoChatCommand<'Global'> = {
	data: {
		name: 'flip',
		description: 'Flip a coin',
	},
	async respond(response) {
		await response.interaction.editReply(
			responseOptions(EmbedType.Info, 'Flip Result:', {
				image: {
					url:
						Math.random() >= 0.5
							? 'https://upload.wikimedia.org/wikipedia/commons/d/dd/2017-D_Roosevelt_dime_obverse_transparent.png'
							: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/2017-D_Roosevelt_dime_reverse_transparent.png',
				},
			}),
		);
	},
	type: 'Global',
};
