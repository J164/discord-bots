import { readdir, writeFile } from 'node:fs/promises';
import { ApplicationCommandOptionType } from 'discord.js';
import { EmbedType, responseOptions } from '../../util/builders.js';
import { download, selectFormat } from '../../voice/ytdl.js';
import { type SwearChatCommand } from '../../types/bot-types/swear.js';
import { URL_PATTERN } from '../../util/regex.js';

export const command: SwearChatCommand<'Global'> = {
	data: {
		name: 'new-song',
		description: "Add a new song to Swear Bot's library",
		options: [
			{
				name: 'url',
				type: ApplicationCommandOptionType.String,
				description: 'The URL for the new swear song',
				required: true,
			},
		],
	},
	async respond(response, globalInfo) {
		if (response.interaction.user.id !== globalInfo.admin && response.interaction.user.id !== globalInfo.swear) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, "You don't have permission to use this command!"));
			return;
		}

		if (!URL_PATTERN.test(response.interaction.options.getString('url', true))) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, 'Not a valid url!'));
			return;
		}

		await response.interaction.editReply(responseOptions(EmbedType.Info, 'Downloading...'));
		const songs = await readdir('./swear_songs');

		const url = response.interaction.options.getString('url', true);
		const format = 'bestaudio[ext=webm][acodec=opus]';

		const metadata = await selectFormat(url, format);
		const data = await download(url, format);

		await writeFile(`./swear_songs/${songs.length + 1}.${metadata.ext}`, data);

		await response.interaction.editReply(responseOptions(EmbedType.Success, 'Success!'));
	},
	type: 'Global',
};
