import type { ChildProcessByStdio } from 'node:child_process';
import type { Readable } from 'node:stream';

/** Object representing audio that can be played by the Player */
type Audio = {
	readonly stream: Readable;
	looping?: boolean;
};

/** Object representing an item in the queue */
type QueueItem = {
	readonly url: string;
	readonly title: string;
	readonly thumbnail: string;
	readonly duration: string;
	looping?: boolean;
};

/** A ChildProcess with a stdout stream outputting audio from YouTube */
type YoutubeStream = ChildProcessByStdio<null, Readable, null>; // eslint-disable-line @typescript-eslint/ban-types
