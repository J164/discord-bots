import { createReadStream, type ReadStream } from 'node:fs';
import { type Readable } from 'node:stream';
import { type YoutubeStream, type Audio } from '../types/voice.js';
import { createStream } from './ytdl.js';

/** Audio fetched from YouTube */
export class YoutubeAudio implements Audio {
	private _spawnProcess: YoutubeStream | undefined;

	public constructor(private readonly _url: string, public looping = false) {
		this._spawnProcess = undefined;
	}

	public resolve(): Readable {
		this._spawnProcess = createStream(this._url, 'bestaudio[acodec=opus]/bestaudio');
		return this._spawnProcess.stdout;
	}

	public destroy(): void {
		this._spawnProcess?.kill();
	}
}

/** Audio fetched from the file system */
export class LocalAudio implements Audio {
	private _fileStream: ReadStream | undefined;

	public constructor(private readonly _path: string, public looping = false) {}

	public resolve(): Readable {
		this._fileStream = createReadStream(this._path);
		return this._fileStream;
	}

	public destroy(): void {
		this._fileStream?.destroy();
	}
}
