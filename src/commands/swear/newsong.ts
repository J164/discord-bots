import { readdirSync } from 'node:fs';
import { ApplicationCommandOptionType } from 'discord.js';
import { EmbedType, responseOptions } from '../../util/builders.js';
import { download } from '../../voice/ytdl.js';
import type { SwearChatCommand } from '../../types/bot-types/swear.js';

export const command: SwearChatCommand<'Global'> = {
	data: {
		name: 'newsong',
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

		if (!/^((http|https):\/\/)?(www\.)?([\d.A-Za-z]{2,256}\.[a-z]{2,6})(\/[\w#%&+./:=?@\\~-]*)?$/.test(response.interaction.options.getString('url', true))) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, 'Not a valid url!'));
			return;
		}

		await response.interaction.editReply(responseOptions(EmbedType.Info, 'Downloading...'));
		const songs = readdirSync(globalInfo.songDirectory);
		try {
			await download(response.interaction.options.getString('url', true), {
				output: `${globalInfo.songDirectory}/${songs.length + 1}.%(ext)s`,
				format: 'bestaudio[ext=webm][acodec=opus]',
			});
			await response.interaction.editReply(responseOptions(EmbedType.Success, 'Success!'));
		} catch (error) {
			globalInfo.logger.error(error, `Chat Command Interaction #${response.interaction.id}) threw an error when downloading`);
			await response.interaction.editReply(responseOptions(EmbedType.Error, 'Download Failed!'));
		}
	},
	type: 'Global',
};
