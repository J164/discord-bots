import { InteractionReplyOptions, MessageEmbedOptions, VoiceChannel } from 'discord.js';
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
import { setTimeout } from 'node:timers/promises';
import { createStream } from '../util/ytdl.js';
import { Readable } from 'node:stream';
import { setInterval } from 'node:timers';
import { ChildProcessByStdio } from 'node:child_process';
import Fuse from 'fuse.js';
import { buildEmbed } from '../util/builders.js';

export interface QueueItem {
  readonly url: string;
  readonly title: string;
  readonly thumbnail: string;
  readonly duration: string;
  looping?: boolean;
}

export class QueueManager {
  private readonly _queue: QueueItem[];
  private _voiceConnection: VoiceConnection;
  private _voiceChannel: VoiceChannel;
  private _player: AudioPlayer;
  private _script: ChildProcessByStdio<null, Readable, null>;
  private _nowPlaying: QueueItem;
  private _queueLoop: boolean;
  private _queueLock: boolean;
  private _transitioning: boolean;

  public constructor() {
    this._queue = [];
    this._queueLoop = false;
    this._queueLock = false;
    this._transitioning = false;

    setInterval(() => {
      if (this._isIdle()) {
        void this.reset();
      }
    }, 300_000);
  }

  public get nowPlaying(): MessageEmbedOptions {
    return this._nowPlaying
      ? buildEmbed('info', {
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
      : buildEmbed('error', { title: 'Nothing has played yet!' });
  }

  public get queueLoop(): boolean {
    return this._queueLoop;
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
    if (this._isActive()) return;

    if (this._voiceConnection?.state.status === VoiceConnectionStatus.Ready) return;
    this._transitioning = true;

    this._voiceConnection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
    this._voiceChannel = voiceChannel;
    await entersState(this._voiceConnection, VoiceConnectionStatus.Ready, 30e3);
    this._player = createAudioPlayer();
    this._voiceConnection.subscribe(this._player);

    void this._playSong();
  }

  private async _playSong(): Promise<void> {
    while (this._queueLock) await setTimeout(200);
    this._queueLock = true;

    if (this._queue.length === 0) {
      this._queueLock = false;
      this._transitioning = false;
      return;
    }

    this._nowPlaying = this._queue.shift();

    this._queueLock = false;

    this._script = createStream(this._nowPlaying.url, {
      format: 'bestaudio[ext=webm][acodec=opus]/bestaudio[ext=ogg][acodec=opus]/bestaudio',
    });
    const { type, stream } = await demuxProbe(this._script.stdout);
    this._player.play(createAudioResource(stream, { inputType: type }));
    await entersState(this._player, AudioPlayerStatus.Playing, 30e3);

    this._transitioning = false;

    this._player.on('stateChange', async (oldState, newState) => {
      if (newState.status !== AudioPlayerStatus.Idle) return;
      this._player.removeAllListeners('stateChange');

      this._transitioning = true;
      this._script.kill();

      if (this._queueLoop || this._nowPlaying.looping) {
        while (this._queueLock) await setTimeout(200);
        this._queueLock = true;

        if (this._queueLoop) {
          this._queue.push(this._nowPlaying);
        } else if (this._nowPlaying.looping) {
          this._queue.unshift(this._nowPlaying);
        }

        this._queueLock = false;
      }

      void this._playSong();
    });
  }

  public searchQueue(search: string): Fuse.FuseResult<QueueItem>[] {
    return new Fuse(this._queue, { keys: ['title'] }).search(search);
  }

  public async skipTo(options: { index?: number; title?: string }): Promise<InteractionReplyOptions> {
    while (this._queueLock) await setTimeout(200);
    this._queueLock = true;

    if (this._queue.length < 2) {
      this._queueLock = false;
      return {
        embeds: [
          buildEmbed('error', {
            title: 'The queue is too small to skip to a specific song!',
          }),
        ],
      };
    }

    options.index ??= this.searchQueue(options.title)[0].refIndex + 1;

    options.index >= this._queue.length
      ? this._queue.unshift(this._queue.pop())
      : this._queue.unshift(this._queue.splice(options.index - 1, 1)[0]);

    this._queueLock = false;
    this.skip();
  }

  public loopSong(): MessageEmbedOptions {
    if (!this._isActive()) {
      return buildEmbed('error', { title: 'Nothing is playing!' });
    }

    if (this._nowPlaying.looping) {
      this._nowPlaying.looping = false;
      return buildEmbed('success', { title: 'No longer looping' });
    }
    this._nowPlaying.looping = true;
    return buildEmbed('success', { title: 'Now Looping' });
  }

  public loopQueue(): MessageEmbedOptions {
    if (!this._isActive() || this._queue.length === 0) {
      return buildEmbed('error', { title: 'Nothing is queued!' });
    }

    if (this._queueLoop) {
      this._queueLoop = false;
      return buildEmbed('success', { title: 'No longer looping queue' });
    }
    this._queueLoop = true;
    return buildEmbed('success', { title: 'Now looping queue' });
  }

  public clear(): boolean {
    if (this._queue.length === 0) {
      return false;
    }

    this._queue.length = 0;
    this._queueLoop = false;
    return true;
  }

  public skip(): boolean {
    return this._player?.stop();
  }

  public pause(): boolean {
    return this._player?.pause(true);
  }

  public resume(): boolean {
    return this._player?.unpause();
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

  public async getPaginatedQueue(): Promise<QueueItem[][]> {
    if (!this._isActive()) return;

    while (this._queueLock) await setTimeout(200);
    this._queueLock = true;

    if (this._queue.length === 0) {
      this._queueLock = false;
      return [[this._nowPlaying]];
    }
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

  private _isActive(): boolean {
    return this._player?.state.status === AudioPlayerStatus.Playing || this._player?.state.status === AudioPlayerStatus.Paused;
  }

  private _isIdle(): boolean {
    return (this._player?.state.status === AudioPlayerStatus.Idle || this._voiceChannel?.members.size <= 1) && !this._transitioning;
  }

  public async reset(): Promise<void> {
    while (this._queueLock) await setTimeout(200);
    this._queueLock = true;

    this._queue.length = 0;
    this._player?.removeAllListeners();
    this._player?.stop();
    delete this._player;
    this._voiceConnection?.destroy();
    delete this._voiceConnection;
    delete this._voiceChannel;
    this._script?.kill();
    delete this._script;
    delete this._nowPlaying;
    this._queueLoop = false;
    this._transitioning = false;

    this._queueLock = false;
  }
}
