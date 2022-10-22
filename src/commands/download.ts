import { ApplicationCommandOptionType } from 'discord.js';
import type { ChatCommand } from '../types/commands.js';
import { EmbedType, responseOptions } from '../util/builders.js';
import { download } from '../voice/ytdl.js';

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
	async respond(response, globalInfo) {
		if (!/^((http|https):\/\/)?(www\.)?([\d.A-Za-z]{2,256}\.[a-z]{2,6})(\/[\w#%&+./:=?@\\~-]*)?$/.test(response.interaction.options.getString('url', true))) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, 'Not a valid url!'));
			return;
		}

		await response.interaction.editReply(responseOptions(EmbedType.Info, 'Downloading...'));
		await download(response.interaction.options.getString('url', true), {
			outtmpl: `${globalInfo.downloadDirectory}/%(title)s.%(ext)s`,
			format: response.interaction.options.getBoolean('dev') ? 'bestaudio[ext=webm][acodec=opus]/bestaudio' : 'best',
		});
		await response.interaction.editReply(responseOptions(EmbedType.Success, 'Download Successful!'));
	},
	type: 'Global',
};
