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

export interface QueueItem {
  readonly url: string;
  readonly title: string;
  readonly thumbnail: string;
  readonly duration: string;
  looping?: boolean;
}

export class QueueManager {
  private readonly _queue: QueueItem[];
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

  public get queueLoop(): boolean {
    return this._queueLoop;
  }

  public get nowPlaying(): InteractionReplyOptions {
    return this._nowPlaying
      ? responseOptions('info', {
          title: `Now Playing: ${this._nowPlaying.title} (${this._nowPlaying.duration})`,
          fields: [
            {
              name: 'URL:',
              value: this._nowPlaying.url,
            },
          ],
          image: { url: this._nowPlaying.thumbnail },
          footer: this._nowPlaying.looping
            ? {
                text: 'Looping',
                icon_url: 'https://www.clipartmax.com/png/middle/353-3539119_arrow-repeat-icon-cycle-loop.png',
              }
            : undefined,
        })
      : responseOptions('error', { title: 'Nothing has played yet!' });
  }

  public async getPaginatedQueue(): Promise<QueueItem[][] | null> {
    if (!this._nowPlaying) {
      return null;
    }

    if (this._queue.length === 0) {
      return [[this._nowPlaying]];
    }

    while (this._queueLock) await setTimeout(200);
    this._queueLock = true;

    const queueArray: QueueItem[][] = [];
    for (let r = 0; r < Math.ceil(this._queue.length / 25); r++) {
      queueArray.push([]);
      for (let index = -1; index < 25; index++) {
        if (r * 25 + index > this._queue.length - 1) {
          break;
        }
        if (r === 0 && index === -1) {
          queueArray[r].push(this._nowPlaying);
          continue;
        }
        queueArray[r].push(this._queue[r * 25 + index]);
      }
    }

    this._queueLock = false;
    return queueArray;
  }

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

  public searchQueue(query: string): Fuse.FuseResult<string>[] {
    return new Fuse(
      this._queue.map((item) => {
        return item.title;
      }),
    ).search(query);
  }

  public async skipTo(term: string | number): Promise<boolean> {
    if (this._queue.length < 2) {
      return false;
    }

    while (this._queueLock) await setTimeout(200);
    this._queueLock = true;
    const index = typeof term === 'number' ? term : this.searchQueue(term)[0].refIndex + 1;
    index >= this._queue.length ? this._queue.unshift(this._queue.pop()!) : this._queue.unshift(this._queue.splice(index - 1, 1)[0]);
    this._queueLock = false;

    this.skip();
    return true;
  }

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

  public clear(): boolean {
    if (this._queue.length === 0) {
      return false;
    }

    this._queue.length = 0;
    this._queueLoop = false;
    return true;
  }

  public skip(): boolean | null {
    this._nowPlaying!.looping = false;
    return this._player?.stop() ?? null;
  }

  public pause(): boolean | null {
    return this._player?.pause(true) ?? null;
  }

  public resume(): boolean | null {
    return this._player?.unpause() ?? null;
  }

  public async shuffleQueue(): Promise<boolean> {
    while (this._queueLock) await setTimeout(200);
    this._queueLock = true;

    if (this._queue.length === 0) {
      this._queueLock = false;
      return false;
    }

    for (let index = this._queue.length - 1; index > 0; index--) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      const temporary = this._queue[index];
      this._queue[index] = this._queue[randomIndex];
      this._queue[randomIndex] = temporary;
    }

    this._queueLock = false;
    return true;
  }

  public async reset(): Promise<void> {
    while (this._queueLock) await setTimeout(200);
    this._queueLock = true;

    this._queue.length = 0;
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
