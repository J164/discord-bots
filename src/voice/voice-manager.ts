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
import { VoiceChannel } from 'discord.js';
import { createReadStream } from 'node:fs';
import { setTimeout } from 'node:timers/promises';
import { responseOptions } from '../util/builders.js';

export class VoiceManager {
  private _voiceConnection: VoiceConnection | null;
  private _voiceChannel: VoiceChannel | null;
  private _player: AudioPlayer | null;
  private _transitioning: boolean;

  public constructor() {
    this._voiceConnection = null;
    this._voiceChannel = null;
    this._player = null;
    this._transitioning = false;
  }

  public async play(voiceChannel: VoiceChannel, path: string, looping = false): Promise<void> {
    while (this._transitioning) await setTimeout(200);
    this._transitioning = true;
    this._player?.removeAllListeners();

    await this._connect(voiceChannel);

    const { type, stream } = await demuxProbe(createReadStream(path));
    this._player!.play(createAudioResource(stream, { inputType: type }));
    try {
      await entersState(this._player!, AudioPlayerStatus.Playing, 30e3);
    } catch {
      void this._voiceChannel!.send(responseOptions('error', { title: `Unable to play the audio` })).catch();
      this.reset();
      return;
    }

    this._player!.once(AudioPlayerStatus.Idle, () => {
      if (looping) {
        if (this._voiceChannel!.members.size <= 1) {
          this.reset();
          return;
        }
        void this.play(voiceChannel, path, true);
        return;
      }
      this.reset();
    });
    this._transitioning = false;
  }

  private async _connect(voiceChannel: VoiceChannel): Promise<void> {
    if (this._voiceConnection?.state.status === VoiceConnectionStatus.Ready) return;

    this._voiceConnection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
    try {
      await entersState(this._voiceConnection, VoiceConnectionStatus.Ready, 30e3);
    } catch {
      void voiceChannel.send(responseOptions('error', { title: 'Unable to connect to this channel' })).catch();
      this.reset();
      return;
    }
    this._voiceChannel = voiceChannel;
    this._player = createAudioPlayer();
    this._voiceConnection.subscribe(this._player);
  }

  public pause(): boolean {
    return this._player?.pause(true) ?? false;
  }

  public resume(): boolean {
    return this._player?.unpause() ?? false;
  }

  public reset(): void {
    this._player?.removeAllListeners();
    this._player?.stop();
    this._player = null;
    this._voiceConnection?.destroy();
    this._voiceConnection = null;
    this._voiceChannel = null;
    this._transitioning = false;
  }
}
