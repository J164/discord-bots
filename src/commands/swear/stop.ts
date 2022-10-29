import type { InteractionReplyOptions } from 'discord.js';
import type { SwearChatCommand } from '../../types/bot-types/swear.js';
import { EmbedType, responseOptions } from '../../util/builders.js';

function stop(info: GuildChatCommandInfo): InteractionReplyOptions {
	info.voiceManager!.reset();
	return responseOptions(EmbedType.Success, 'Success');
}

export const command: SwearChatCommand<'Guild'> = {
	data: {
		name: 'stop',
		description: 'Stop the song',
	},
	respond: stop,
	type: 'Guild',
};
