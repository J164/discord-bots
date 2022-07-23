import {
  AudioPlayer,
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  demuxProbe,
  entersState,
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import { InteractionReplyOptions, VoiceChannel } from 'discord.js';
import Fuse from 'fuse.js';
import { ChildProcessByStdio } from 'node:child_process';
import { Readable } from 'node:stream';
import { setTimeout } from 'node:timers/promises';
import { responseOptions } from '../util/builders.js';
import { createStream } from './ytdl.js';

/**
 * Object representing an item in the queue
 */
export interface QueueItem {
  readonly url: string;
  readonly title: string;
  readonly thumbnail: string;
  readonly duration: string;
  looping?: boolean;
}

/**
 * Represents a queue manager for a guild
 */
export class QueueManager {
  private _queue: QueueItem[];
  private _voiceConnection: VoiceConnection | null;
  private _voiceChannel: VoiceChannel | null;
  private _player: AudioPlayer | null;
  private _script: ChildProcessByStdio<null, Readable, null> | null;
  private _nowPlaying: QueueItem | null;
  private _queueLoop: boolean;
  private _queueLock: boolean;

  public constructor() {
    this._queue = [];
    this._voiceConnection = null;
    this._voiceChannel = null;
    this._player = null;
    this._script = null;
    this._nowPlaying = null;
    this._queueLoop = false;
    this._queueLock = false;
  }

  public get queue(): QueueItem[] {
    return this._queue;
  }

  public get queueLoop(): boolean {
    return this._queueLoop;
  }

  public get nowPlaying(): QueueItem | null {
    return this._nowPlaying;
  }

  /**
   * Adds items to the queue
   * @param items the items to add to the queue
   * @param position where in the queue to insert the items
   * @returns
   */
  public async addToQueue(items: QueueItem[], position: number): Promise<void> {
    while (this._queueLock) await setTimeout(200);
    this._queueLock = true;

    if (position === -1 || position >= this._queue.length) {
      this._queue.push(...items);
      this._queueLock = false;
      return;
    }
    if (position === 0) {
      this._queue.unshift(...items);
      this._queueLock = false;
      return;
    }
    this._queue.splice(position, 0, ...items);
    this._queueLock = false;
  }

  /**
   * Connects the bot to voice and starts playing the queue if a voice connection has not already been made
   * @param voiceChannel the channel to connect the bot to
   * @returns
   */
  public async connect(voiceChannel: VoiceChannel): Promise<void> {
    if (this._voiceConnection) return;

    this._voiceConnection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
    try {
      await entersState(this._voiceConnection, VoiceConnectionStatus.Ready, 30e3);
    } catch {
      void voiceChannel.send(responseOptions('error', { title: 'Unable to connect to this channel' })).catch();
      void this.reset();
      return;
    }
    this._voiceChannel = voiceChannel;
    this._player = createAudioPlayer();
    this._voiceConnection.subscribe(this._player);

    void this._play();
  }

  /**
   * Starts playing items in the queue
   * @returns
   */
  private async _play(): Promise<void> {
    if (!this._nowPlaying?.looping) {
      while (this._queueLock) await setTimeout(200);
      this._queueLock = true;
      this._nowPlaying = this._queue.shift()!;
      this._queueLock = false;
    }

    this._script = createStream(this._nowPlaying.url, {
      format: 'bestaudio[acodec=opus]/bestaudio',
    });
    const { type, stream } = await demuxProbe(this._script.stdout);
    this._player!.play(createAudioResource(stream, { inputType: type }));

    try {
      await entersState(this._player!, AudioPlayerStatus.Playing, 30e3);
    } catch {
      void this._voiceChannel!.send(responseOptions('error', { title: `Unable to play ${this._nowPlaying.title}` })).catch();
      this._script.kill();
      this._nowPlaying.looping = false;
      if (this._queue.length === 0 || this._voiceChannel!.members.size <= 1) {
        void this.reset();
        return;
      }
      void this._play();
      return;
    }

    this._player!.once(AudioPlayerStatus.Idle, async () => {
      this._script!.kill();

      if (this._queueLoop) {
        while (this._queueLock) await setTimeout(200);
        this._queueLock = true;
        this._queue.push(this._nowPlaying!);
        this._queueLock = false;
      }

      if (this._queue.length === 0 || this._voiceChannel!.members.size <= 1) {
        void this.reset();
        return;
      }
      void this._play();
    });
  }

  /**
   * Searches the queue for an item with a title matching the query
   * @param query the name of the item to search for
   * @returns An array of fuse search results
   */
  public searchQueue(query: string): Fuse.FuseResult<string>[] {
    return new Fuse(
      this._queue.map((item) => {
        return item.title;
      }),
    ).search(query);
  }

  /**
   * Pulls an item to the beginning of the queue and skips the current song
   * @param index index of the item to skip to
   * @returns whether the operation succeeded or not
   */
  public async skipTo(index: number): Promise<boolean> {
    if (this._queue.length < 2) {
      return false;
    }

    while (this._queueLock) await setTimeout(200);
    this._queueLock = true;
    index >= this._queue.length ? this._queue.unshift(this._queue.pop()!) : this._queue.unshift(this._queue.splice(index - 1, 1)[0]);
    this._queueLock = false;

    this.skip();
    return true;
  }

  /**
   * Toggles whether the current song is looping or not
   * @returns interaction response representing the result of the operation
   */
  public loopSong(): InteractionReplyOptions {
    if (this._player?.state.status === AudioPlayerStatus.Idle) {
      return responseOptions('error', { title: 'Nothing is playing!' });
    }

    if (this._nowPlaying!.looping) {
      this._nowPlaying!.looping = false;
      return responseOptions('success', { title: 'No longer looping' });
    }
    this._queueLoop = false;
    this._nowPlaying!.looping = true;
    return responseOptions('success', { title: 'Now Looping' });
  }

  /**
   * Toggles whether the queue is looping or not
   * @returns interaction response representing the result of the operation
   */
  public loopQueue(): InteractionReplyOptions {
    if (this._queue.length === 0) {
      return responseOptions('error', { title: 'Nothing is queued!' });
    }

    if (this._queueLoop) {
      this._queueLoop = false;
      return responseOptions('success', { title: 'No longer looping queue' });
    }
    this._nowPlaying!.looping = false;
    this._queueLoop = true;
    return responseOptions('success', { title: 'Now looping queue' });
  }

  /**
   * Clears the entire queue
   * @returns
   */
  public async clear(): Promise<void> {
    if (this._queue.length === 0) {
      return;
    }

    while (this._queueLock) await setTimeout(200);
    this._queueLock = true;

    this._queue = [];

    this._queueLock = false;
    this._queueLoop = false;
    return;
  }

  /**
   * Skips the currently playing song
   * @returns whether the operation succeeded or not
   */
  public skip(): boolean {
    this._nowPlaying!.looping = false;
    return this._player?.stop() ?? false;
  }

  /**
   * Pauses the currently playing song
   * @returns whether the operation succeeded or not
   */
  public pause(): boolean {
    return this._player?.pause(true) ?? false;
  }

  /**
   * Resumes the currently playing song
   * @returns whether the operation succeeded or not
   */
  public resume(): boolean {
    return this._player?.unpause() ?? false;
  }

  /**
   * Randomizes the order of the queue
   * @returns whether the operation succeeded or not
   */
  public async shuffleQueue(): Promise<boolean> {
    if (this._queue.length === 0) {
      return false;
    }

    while (this._queueLock) await setTimeout(200);
    this._queueLock = true;

    for (let index = this._queue.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [this._queue[index], this._queue[randomIndex]] = [this._queue[randomIndex], this._queue[index]];
    }

    this._queueLock = false;
    return true;
  }

  /**
   * Resets the QueueManager to its original state
   * @returns
   */
  public async reset(): Promise<void> {
    while (this._queueLock) await setTimeout(200);
    this._queueLock = true;

    this._queue = [];
    this._player?.removeAllListeners();
    this._player?.stop();
    this._player = null;
    this._voiceConnection?.destroy();
    this._voiceConnection = null;
    this._voiceChannel = null;
    this._script?.kill();
    this._script = null;
    this._nowPlaying = null;
    this._queueLoop = false;

    this._queueLock = false;
  }
}
