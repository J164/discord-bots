import { type ChildProcessByStdio } from 'node:child_process';
import { type Readable } from 'node:stream';

/** Valid audio types */
export const enum AudioTypes {
	Local = 'local',
	YouTube = 'youtube',
}

/** Object representing audio that can be played by the Player */
type Audio = {
	looping?: boolean;
	readonly url: string;
	readonly type: AudioTypes;
};

/** Object representing an item in the queue */
type QueueItem = {
	readonly title: string;
	readonly thumbnail: string;
	readonly duration: string;
} & Audio;

/** A ChildProcess with a stdout stream outputting audio from YouTube */
type YoutubeStream = ChildProcessByStdio<null, Readable, null>; // eslint-disable-line @typescript-eslint/ban-types
