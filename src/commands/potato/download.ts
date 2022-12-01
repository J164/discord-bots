import { ApplicationCommandOptionType } from 'discord.js';
import { Dropbox } from 'dropbox';
import { type PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, responseOptions } from '../../util/builders.js';
import { download, selectFormat } from '../../voice/ytdl.js';
import { URL_PATTERN } from '../../util/regex.js';
import { fileExists, shareFile, uploadFile } from '../../util/dropbox.js';

export const command: PotatoChatCommand<'Global'> = {
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
		if (!URL_PATTERN.test(response.interaction.options.getString('url', true))) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, 'Not a valid url!'));
			return;
		}

		await response.interaction.editReply(responseOptions(EmbedType.Info, 'Downloading...'));

		const url = response.interaction.options.getString('url', true);
		const format = response.interaction.options.getBoolean('dev') ? 'bestaudio[ext=webm][acodec=opus]/bestaudio' : 'best';

		const { id, ext } = await selectFormat(url, format);
		const fileName = `${id}.${ext}`;

		const dropbox = new Dropbox({ accessToken: globalInfo.dropboxToken });

		// FIXME: access tokens for dropbox are meant to be temporary and fileExists function does not work ('invalid_argument' on api call)
		if (!(await fileExists(dropbox, fileName, 'downloads'))) {
			const data = await download(url, format);

			await uploadFile(dropbox, data, `downloads/${fileName}`);
		}

		await response.interaction.editReply(responseOptions(EmbedType.Success, `Download Successful! (<${await shareFile(dropbox, `downloads/${fileName}`)}>)`));
	},
	type: 'Global',
};
