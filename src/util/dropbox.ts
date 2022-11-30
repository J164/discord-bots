import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { type sharing, type Dropbox } from 'dropbox';

const BLOCK_SIZE = 4 * 1024 * 1024;
const CHUNK_SIZE = BLOCK_SIZE * 35;

export async function fileExists(dropbox: Dropbox, fileName: string, path: string): Promise<boolean> {
	const results = await dropbox.filesSearchV2({
		query: fileName,
		options: {
			path,
			filename_only: true,
		},
	});

	return results.result.matches[0].metadata['.tag'] === 'metadata' ? results.result.matches[0].metadata.metadata.name === fileName : false;
}

export async function shareFile(dropbox: Dropbox, path: string, options?: sharing.SharedLinkSettings): Promise<string> {
	const sharedLinks = await dropbox.sharingListSharedLinks({ path });
	let sharedLink = sharedLinks.result.links[0].url;
	if (!sharedLink) {
		const sharing = await dropbox.sharingCreateSharedLinkWithSettings(options ? { path, settings: options } : { path });
		sharedLink = sharing.result.url;
	}

	return sharedLink;
}

export async function uploadFile(dropbox: Dropbox, file: Buffer, path: string) {
	const blockedFile = [];
	const blockHashes = [];

	for (let i = 0; i < file.length; i += CHUNK_SIZE) {
		const chunk = file.subarray(i, i + CHUNK_SIZE);
		for (let j = 0; j < chunk.length; j += BLOCK_SIZE) {
			blockHashes.push(
				createHash('sha256')
					.update(chunk.subarray(j, j + BLOCK_SIZE))
					.digest(),
			);
		}

		blockedFile.push(chunk);
	}

	const upload = await dropbox.filesUploadSessionStart({
		session_type: { '.tag': 'concurrent' },
		content_hash: createHash('sha256').update(Buffer.concat(blockHashes)).digest('hex'),
	});

	await Promise.all(
		blockedFile.map(async (chunk, index) => {
			await dropbox.filesUploadSessionAppendV2({
				cursor: { offset: index * CHUNK_SIZE, session_id: upload.result.session_id },
				contents: chunk,
				close: index + 1 === blockedFile.length,
			});
		}),
	);

	await dropbox.filesUploadSessionFinish({
		commit: { path },
		cursor: { offset: file.length, session_id: upload.result.session_id },
	});
}
