import type { AudioPlayer, VoiceConnection } from '@discordjs/voice';
import { AudioPlayerStatus, createAudioPlayer, createAudioResource, demuxProbe, entersState, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import type { VoiceChannel } from 'discord.js';
import type { QueueItem, YoutubeStream } from '../types/voice.js';
import { responseOptions } from '../util/builders.js';
import { createStream } from './ytdl.js';

/** Represents the voice state of the bot in a guild */
export class Player {
	private readonly _player: AudioPlayer;
	private readonly _voiceConnection: VoiceConnection;
	private readonly _voiceChannel: VoiceChannel;
	private _script: YoutubeStream | undefined;
	private _subscribed: boolean;

	public constructor(voiceChannel: VoiceChannel, callback: () => void) {
		this._player = createAudioPlayer();
		this._voiceChannel = voiceChannel;
		this._voiceConnection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guild.id,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator,
		}).once(VoiceConnectionStatus.Disconnected, callback);

		this._script = undefined;
		this._subscribed = false;
	}

	public get destroyed(): boolean {
		return this._voiceConnection.state.status === VoiceConnectionStatus.Destroyed;
	}

	public get subscribed(): boolean {
		return this._subscribed;
	}

	/**
	 * Ensures the connection to the voice channel is ready and subscribes the audio player to the connection
	 * @returns A Promise that resolves to whether the connection succeeded
	 */
	public async subscribe(): Promise<boolean> {
		try {
			await entersState(this._voiceConnection, VoiceConnectionStatus.Ready, 30e3);
		} catch {
			void this._voiceChannel.send(responseOptions('error', { title: 'Unable to connect to this channel' })).catch();
			return false;
		}

		this._voiceConnection.subscribe(this._player);
		this._subscribed = true;

		return true;
	}

	/**
	 * Plays the given audio and then executes a callback
	 * @param audio The audio to play
	 * @param callback The callback to execute when the audio ends
	 * @returns A Promise that resolves to whether the audio began playing successfully
	 */
	public async play(audio: QueueItem, callback: () => void): Promise<boolean> {
		if (this._voiceChannel.members.size <= 1) {
			return true;
		}

		this._script = createStream(audio.url, {
			format: 'bestaudio[acodec=opus]/bestaudio',
		});
		const { type, stream } = await demuxProbe(this._script.stdout);
		this._player.play(createAudioResource(stream, { inputType: type }));

		try {
			await entersState(this._player, AudioPlayerStatus.Playing, 30e3);
		} catch {
			this._script.kill();
			void this._voiceChannel.send(responseOptions('error', { title: `Unable to play ${audio.title}` })).catch();
			return false;
		}

		this._player.once(AudioPlayerStatus.Idle, () => {
			this._script?.kill();

			if (audio?.looping) {
				void this.play(audio, callback);
				return;
			}

			callback();
		});

		return true;
	}

	/**
	 * Pauses the audio player
	 * @returns Whether the player was paused successfully
	 */
	public pause(): boolean {
		return this._player.pause(true);
	}

	/**
	 * Unpauses the audio player
	 * @returns Whether the player was unpaused successfully
	 */
	public resume(): boolean {
		return this._player.unpause();
	}

	/**
	 * Stops the audio player
	 * @returns Whether the player was stopped successfully
	 */
	public stop(): boolean {
		return this._player.stop();
	}

	/**
	 * Stops the audio player and destroys the connection
	 */
	public destroy(): void {
		this._script?.kill();
		this._player.removeAllListeners();
		this.stop();
		this._subscribed = false;
		this._voiceConnection.removeAllListeners();
		this._voiceConnection.destroy();
	}
}
