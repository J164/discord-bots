import type { InteractionReplyOptions } from 'discord.js';
import type { CrystalChatCommand } from '../../types/bot-types/crystal.js';
import { EmbedType, responseOptions } from '../../util/builders.js';

function stop(info: GuildChatCommandInfo): InteractionReplyOptions {
	info.voiceManager!.reset();
	return responseOptions(EmbedType.Success, 'Success');
}

export const command: CrystalChatCommand<'Guild'> = {
	data: {
		name: 'stop',
		description: 'Stop the song',
	},
	respond: stop,
	type: 'Guild',
};
