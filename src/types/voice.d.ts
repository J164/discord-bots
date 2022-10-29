import type { ChildProcessByStdio } from 'node:child_process';
import type { Readable } from 'node:stream';

/** Object representing an item in the queue */
export type QueueItem = {
	readonly url: string;
	readonly title: string;
	readonly thumbnail: string;
	readonly duration: string;
	looping?: boolean;
};

/** A ChildProcess with a stdout stream outputting audio from YouTube */
export type YoutubeStream = ChildProcessByStdio<null, Readable, null>; // eslint-disable-line @typescript-eslint/ban-types
