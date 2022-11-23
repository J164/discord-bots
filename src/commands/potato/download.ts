import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { ApplicationCommandOptionType } from 'discord.js';
import { Dropbox } from 'dropbox';
import { type PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, responseOptions } from '../../util/builders.js';
import { download, selectFormat } from '../../voice/ytdl.js';
import { URL_PATTERN } from '../../util/regex.js';

const BLOCK_SIZE = 4 * 1024 * 1024;
const CHUNK_SIZE = BLOCK_SIZE * 35;

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

		const metadata = await selectFormat(url, format);
		const filePath = `/Apps/discord-bots/video_downloads/${metadata.id}.${metadata.ext}`;

		const dropbox = new Dropbox({ accessToken: globalInfo.dropboxToken });

		try {
			const sharedLinks = await dropbox.sharingListSharedLinks({ path: filePath });
			let sharedLink = sharedLinks.result.links[0].url;
			if (!sharedLink) {
				const sharing = await dropbox.sharingCreateSharedLinkWithSettings({ path: filePath });
				sharedLink = sharing.result.url;
			}

			await response.interaction.editReply(responseOptions(EmbedType.Success, `Download Successful! (<${sharedLink}>)`));
			return;
		} catch {}

		const blockHashes = [];
		const file = [];

		const data = await download(url, format);

		for (let i = 0; i < data.length; i += CHUNK_SIZE) {
			const chunk = data.subarray(i, i + CHUNK_SIZE);
			for (let j = 0; j < chunk.length; j += BLOCK_SIZE) {
				blockHashes.push(
					createHash('sha256')
						.update(chunk.subarray(j, j + BLOCK_SIZE))
						.digest(),
				);
			}

			file.push(chunk);
		}

		const fileHash = createHash('sha256').update(Buffer.concat(blockHashes)).digest('hex');

		const upload = await dropbox.filesUploadSessionStart({ session_type: { '.tag': 'concurrent' }, content_hash: fileHash });
		await Promise.all(
			file.map(async (chunk, index) => {
				await dropbox.filesUploadSessionAppendV2({
					cursor: { offset: index * CHUNK_SIZE, session_id: upload.result.session_id },
					contents: chunk,
					close: index + 1 === file.length,
				});
			}),
		);
		await dropbox.filesUploadSessionFinish({
			commit: { path: filePath },
			cursor: { offset: data.length, session_id: upload.result.session_id },
		});
		const sharedLink = await dropbox.sharingCreateSharedLinkWithSettings({ path: filePath });

		await response.interaction.editReply(responseOptions(EmbedType.Success, `Download Successful! (<${sharedLink.result.url}>)`));
	},
	type: 'Global',
};
