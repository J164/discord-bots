import type { InteractionReplyOptions } from 'discord.js';
import type { SwearChatCommand } from '../../types/bot-types/swear.js';
import { EmbedType, responseOptions } from '../../util/builders.js';

function pause(info: GuildChatCommandInfo): InteractionReplyOptions {
	if (info.voiceManager!.pause()) {
		return responseOptions(EmbedType.Success, 'Paused!');
	}

	return responseOptions(EmbedType.Error, 'Nothing is playing');
}

export const command: SwearChatCommand<'Guild'> = {
	data: {
		name: 'pause',
		description: 'Pause the song',
	},
	respond: pause,
	type: 'Guild',
};
