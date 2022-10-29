import type { InteractionReplyOptions } from 'discord.js';
import type { SwearChatCommand } from '../../types/bot-types/swear.js';
import { EmbedType, responseOptions } from '../../util/builders.js';

function resume(info: GuildChatCommandInfo): InteractionReplyOptions {
	if (info.voiceManager!.resume()) {
		return responseOptions(EmbedType.Success, 'Resumed!');
	}

	return responseOptions(EmbedType.Error, 'Nothing is playing!');
}

export const command: SwearChatCommand<'Guild'> = {
	data: {
		name: 'resume',
		description: 'Resume the song',
	},
	respond: resume,
	type: 'Guild',
};
