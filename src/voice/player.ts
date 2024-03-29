/* eslint-disable @typescript-eslint/no-empty-function */
import {
	type AudioPlayer,
	type VoiceConnection,
	AudioPlayerStatus,
	createAudioPlayer,
	createAudioResource,
	demuxProbe,
	entersState,
	joinVoiceChannel,
	VoiceConnectionStatus,
} from '@discordjs/voice';
import { type VoiceChannel } from 'discord.js';
import { type Audio } from '../types/voice.js';

/** Represents the voice state of the bot in a guild */
export class Player {
	private readonly _player: AudioPlayer;
	private readonly _voiceConnection: VoiceConnection;
	private readonly _voiceChannel: VoiceChannel;
	private _subscribed: boolean;
	private _nowPlaying?: Audio;

	/**
	 * Connects to a voice channel and creates a Player to manage it
	 * @param voiceChannel Voice channel to connect to
	 * @param callback Callback to be executed when the voice connection is destroyed
	 */
	public constructor(voiceChannel: VoiceChannel, callback = () => {}) {
		this._player = createAudioPlayer();
		this._voiceChannel = voiceChannel;
		this._voiceConnection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guild.id,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator,
		});

		this._voiceConnection.once(VoiceConnectionStatus.Disconnected, () => {
			this.destroy();
			callback();
		});

		this._subscribed = false;
	}

	public get voiceChannel(): VoiceChannel {
		return this._voiceChannel;
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
			return false;
		}

		this._voiceConnection.subscribe(this._player);
		this._subscribed = true;

		return true;
	}

	/**
	 * Plays the given audio and then executes a callback
	 * @param audio The audio to play
	 * @param callback Callback to be executed when the audio finishes playing
	 * @returns A Promise that resolves to whether the audio began playing successfully
	 */
	public async play(audio: Audio, callback = () => {}): Promise<boolean> {
		if (this._voiceChannel.members.size <= 1) {
			return true;
		}

		this._nowPlaying = audio;

		const { type, stream } = await demuxProbe(this._nowPlaying.resolve());
		this._player.play(createAudioResource(stream, { inputType: type }));

		try {
			await entersState(this._player, AudioPlayerStatus.Playing, 30e3);
		} catch {
			return false;
		}

		this._player.once(AudioPlayerStatus.Idle, async () => {
			this._nowPlaying?.destroy();

			if (audio.looping) {
				await this.play(audio, callback);
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
		if (this.destroyed) {
			return;
		}

		this._nowPlaying?.destroy();
		this._player.removeAllListeners();
		this.stop();
		this._subscribed = false;
		this._voiceConnection.removeAllListeners();
		this._voiceConnection.destroy();
	}
}
