import { type InteractionReplyOptions, type VoiceChannel } from 'discord.js';
import { type QueueItem } from '../types/voice.js';
import { EmbedType, responseOptions } from '../util/builders.js';
import { Player } from './player.js';

/** Represents the audio queue for a guild */
export class QueueManager {
	private _player: Player;
	private _queue: QueueItem[];
	private _nowPlaying: QueueItem | undefined;
	private _queueLoop: boolean;

	public constructor(voiceChannel: VoiceChannel) {
		this._player = new Player(voiceChannel, () => {
			this.reset();
		});

		this._queue = [];
		this._nowPlaying = undefined;
		this._queueLoop = false;
	}

	public get queue(): QueueItem[] {
		if (!this._nowPlaying) {
			return [];
		}

		return [this._nowPlaying, ...this._queue];
	}

	public get queueLoop(): boolean {
		return this._queueLoop;
	}

	public get nowPlaying(): QueueItem | undefined {
		return this._nowPlaying;
	}

	/**
	 * Adds QueueItems to the queue
	 * @param voiceChannel The VoiceChannel to connect to
	 * @param items The items to add to the queue
	 * @param position Where in the queue to insert the items
	 * @returns A Promise that resolves when the items have been added
	 */
	public async addToQueue(voiceChannel: VoiceChannel, items: QueueItem[], position: number): Promise<void> {
		if (position === -1 || position >= this._queue.length) {
			this._queue.push(...items);
		} else if (position === 0) {
			this._queue.unshift(...items);
		} else {
			this._queue.splice(position, 0, ...items);
		}

		await this._connect(voiceChannel);
	}

	/**
	 * Pulls an item to the beginning of the queue and skips the current audio
	 * @param index The index of the item to skip to
	 * @returns Whether the operation succeeded
	 */
	public skipTo(index: number): boolean {
		const targetSong = index >= this._queue.length ? this._queue.pop() : this._queue.splice(index - 1, 1)[0];

		if (!targetSong) {
			return false;
		}

		this._queue.unshift(targetSong);
		return this.skip();
	}

	/**
	 * Toggles whether the current audio is looping or not
	 * @returns An Interaction response representing the result of the operation or undefined if nothing is playing
	 */
	public loopSong(): InteractionReplyOptions | undefined {
		if (!this._nowPlaying) {
			return;
		}

		if (this._nowPlaying.audio.looping) {
			this._nowPlaying.audio.looping = false;
			return responseOptions(EmbedType.Success, 'No longer looping');
		}

		this._queueLoop = false;
		this._nowPlaying.audio.looping = true;
		return responseOptions(EmbedType.Success, 'Now Looping');
	}

	/**
	 * Toggles whether the queue is looping or not
	 * @returns An interaction response representing the result of the operation or nothing if the queue is empty
	 */
	public loopQueue(): InteractionReplyOptions | undefined {
		if (this._queue.length === 0) {
			return;
		}

		if (this._queueLoop) {
			this._queueLoop = false;
			return responseOptions(EmbedType.Success, 'No longer looping queue');
		}

		if (this._nowPlaying) {
			this._nowPlaying.audio.looping = false;
		}

		this._queueLoop = true;
		return responseOptions(EmbedType.Success, 'Now looping queue');
	}

	/** Clears the entire queue */
	public clear(): void {
		this._queueLoop = false;
		this._queue = [];
	}

	/**
	 * Skips the currently playing audio
	 * @returns Whether the operation succeeded
	 */
	public skip(): boolean {
		if (this._nowPlaying) {
			this._nowPlaying.audio.looping = false;
		}

		return this._player.stop();
	}

	/**
	 * Pauses the currently playing audio
	 * @returns Whether the operation succeeded
	 */
	public pause(): boolean {
		return this._player.pause();
	}

	/**
	 * Resumes the currently playing audio
	 * @returns Whether the operation succeeded
	 */
	public resume(): boolean {
		return this._player.resume();
	}

	/**
	 * Randomizes the order of the queue
	 * @returns Whether the operation succeeded
	 */
	public shuffleQueue(): boolean {
		if (this._queue.length === 0) {
			return false;
		}

		for (let index = this._queue.length - 1; index > 0; index--) {
			const randomIndex = Math.floor(Math.random() * (index + 1));
			[this._queue[index], this._queue[randomIndex]] = [this._queue[randomIndex], this._queue[index]];
		}

		return true;
	}

	/** Resets the QueueManager to its original state */
	public reset(): void {
		this._queue = [];
		this._player.destroy();
		this._nowPlaying = undefined;
		this._queueLoop = false;
	}

	/**
	 * Connects the bot to voice and starts playing the queue if a voice connection has not already been made
	 * @param voiceChannel The channel to connect the bot to
	 * @returns A void Promise that resolves when the _play method has been envoked
	 */
	private async _connect(voiceChannel: VoiceChannel): Promise<void> {
		if (this._player.subscribed) {
			return;
		}

		if (this._player.destroyed) {
			this._player = new Player(voiceChannel, () => {
				this.reset();
			});
		}

		if (!(await this._player.subscribe())) {
			await this._player.voiceChannel.send(responseOptions(EmbedType.Error, 'Unable to connect to this channel'));
			return;
		}

		await this._play();
	}

	/**
	 * Starts playing audio from the queue
	 * @returns A void Promise that resolves when when the audio has started playing
	 */
	private async _play(): Promise<void> {
		this._nowPlaying = this._queue.shift();

		if (!this._nowPlaying) {
			this.reset();
			return;
		}

		const success = await this._player.play(this._nowPlaying.audio, async () => {
			if (this._queueLoop && this._nowPlaying) {
				this._queue.push(this._nowPlaying);
			}

			await this._play();
		});

		if (!success) {
			await this._player.voiceChannel.send(responseOptions(EmbedType.Error, `Unable to play audio`));
			await this._play();
		}
	}
}
