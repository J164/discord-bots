import type { InteractionReplyOptions } from 'discord.js';
import type { ChatCommand } from '../types/commands.js';
import { responseOptions } from '../util/builders.js';

function flip(): InteractionReplyOptions {
	return responseOptions('info', {
		title: 'Flip Result:',
		image: {
			url:
				Math.random() >= 0.5
					? 'https://upload.wikimedia.org/wikipedia/commons/d/dd/2017-D_Roosevelt_dime_obverse_transparent.png'
					: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/2017-D_Roosevelt_dime_reverse_transparent.png',
		},
	});
}

export const command: ChatCommand<'Global'> = {
	data: {
		name: 'flip',
		description: 'Flip a coin',
	},
	respond: flip,
	type: 'Global',
};
