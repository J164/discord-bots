import type { InteractionReplyOptions, VoiceChannel } from 'discord.js';
import type { GuildInfo } from '../types/commands.js';
import type { QueueItem } from '../types/voice.js';
import { responseOptions } from '../util/builders.js';
import { Player } from './player.js';

/** Represents the audio queue for a guild */
export class QueueManager {
	/**
	 * Creates a new QueueManager if one is not already present, adds the items to the queue, and plays them in a voice channel
	 * @param guildInfo The guildInfo for the guild to play audio in
	 * @param voiceChannel The voice channel to play audio in
	 * @param items The items to add to the queue
	 * @param position The position in the queue to insert the items
	 * @returns A Promise that resolves when the QueueManager has connected
	 */
	public static async play(guildInfo: GuildInfo, voiceChannel: VoiceChannel, items: QueueItem[], position: number): Promise<void> {
		guildInfo.queueManager ??= new QueueManager(voiceChannel);
		guildInfo.queueManager._addToQueue(items, position);
		await guildInfo.queueManager._connect(voiceChannel);
	}

	private _player: Player;
	private _queue: QueueItem[];
	private _nowPlaying: QueueItem | undefined;
	private _queueLoop: boolean;

	private constructor(voiceChannel: VoiceChannel) {
		this._player = new Player(voiceChannel, () => {
			this.reset();
		});
		this._queue = [];
		this._nowPlaying = undefined;
		this._queueLoop = false;
	}

	public get queue(): QueueItem[] {
		return this._queue;
	}

	public get queueLoop(): boolean {
		return this._queueLoop;
	}

	public get nowPlaying(): QueueItem | undefined {
		return this._nowPlaying;
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

		if (this._nowPlaying.looping) {
			this._nowPlaying.looping = false;
			return responseOptions('success', { title: 'No longer looping' });
		}

		this._queueLoop = false;
		this._nowPlaying.looping = true;
		return responseOptions('success', { title: 'Now Looping' });
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
			return responseOptions('success', { title: 'No longer looping queue' });
		}

		if (this._nowPlaying) {
			this._nowPlaying.looping = false;
		}

		this._queueLoop = true;
		return responseOptions('success', { title: 'Now looping queue' });
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
			this._nowPlaying.looping = false;
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
	 * Adds QueueItems to the queue
	 * @param items The items to add to the queue
	 * @param position Where in the queue to insert the items
	 */
	private _addToQueue(items: QueueItem[], position: number): void {
		if (position === -1 || position >= this._queue.length) {
			this._queue.push(...items);
			return;
		}

		if (position === 0) {
			this._queue.unshift(...items);
			return;
		}

		this._queue.splice(position, 0, ...items);
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

		await this._player.subscribe();

		void this._play();
	}

	/**
	 * Starts playing audio from the queue
	 * @returns A void Promise that resolves when when the audio has started playing
	 */
	private async _play(): Promise<void> {
		if (!this._nowPlaying?.looping) {
			this._nowPlaying = this._queue.shift();

			if (!this._nowPlaying) {
				this.reset();
				return;
			}
		}

		const success = await this._player.play(this._nowPlaying, () => {
			if (this._queueLoop && this._nowPlaying) {
				this._queue.push(this._nowPlaying);
			}

			void this._play();
		});

		if (!success) {
			this._nowPlaying.looping = false;
			void this._play();
		}
	}
}
