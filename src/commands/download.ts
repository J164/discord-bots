import type { InteractionReplyOptions } from 'discord.js';
import { ApplicationCommandOptionType } from 'discord.js';
import type { ChatCommand, GlobalChatCommandInfo } from '../types/commands.js';
import { responseOptions } from '../util/builders.js';
import { logger } from '../util/logger.js';
import { download } from '../voice/ytdl.js';

async function downloadVideo(globalInfo: GlobalChatCommandInfo<'Global'>): Promise<InteractionReplyOptions> {
	if (
		!/^((http|https):\/\/)?(www\.)?([\d.A-Za-z]{2,256}\.[a-z]{2,6})(\/[\w#%&+./:=?@\\~-]*)?$/.test(
			globalInfo.response.interaction.options.getString('url', true),
		)
	) {
		return responseOptions('error', { title: 'Not a valid url!' });
	}

	void globalInfo.response.interaction.editReply(responseOptions('info', { title: 'Downloading...' }));
	try {
		await download(globalInfo.response.interaction.options.getString('url', true), {
			outtmpl: `${globalInfo.downloadDirectory}/%(title)s.%(ext)s`,
			format: globalInfo.response.interaction.options.getBoolean('dev') ? 'bestaudio[ext=webm][acodec=opus]/bestaudio' : 'best',
		});
		return responseOptions('success', { title: 'Download Successful!' });
	} catch (error) {
		logger.error(error, `Chat Command Interaction #${globalInfo.response.interaction.id}) threw an error when downloading`);
		return responseOptions('error', { title: 'Download Failed!' });
	}
}

export const command: ChatCommand<'Global'> = {
	data: {
		name: 'download',
		description: 'Download a video off of Youtube',
		options: [
			{
				name: 'url',
				description: 'The url of the video you want to download',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
			{
				name: 'dev',
				description: 'Download the opus encoded webm file for this song',
				type: ApplicationCommandOptionType.Boolean,
				required: false,
			},
		],
	},
	respond: downloadVideo,
	type: 'Global',
};
