import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, demuxProbe, entersState, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice'
import { VoiceChannel } from 'discord.js'
import { Readable } from 'node:stream'

export class VoiceManager {

    private _voiceConnection: VoiceConnection
    private _voiceChannel: VoiceChannel
    private _player: AudioPlayer

    public get player(): AudioPlayer {
        return this._player
    }

    public async connect(voiceChannel: VoiceChannel): Promise<void> {
        if (this._voiceConnection?.state.status === VoiceConnectionStatus.Ready) return

        this._voiceConnection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guildId,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        })
        this._voiceChannel = voiceChannel
        await entersState(this._voiceConnection, VoiceConnectionStatus.Ready, 30e3)
        this._player = createAudioPlayer()
        this._voiceConnection.subscribe(this._player)
    }

    public async playStream(originalStream: Readable): Promise<void> {
        const { type, stream } = await demuxProbe(originalStream)
        this._player.play(createAudioResource(stream, { inputType: type }))
        await entersState(this._player, AudioPlayerStatus.Playing, 30e3)
    }

    public pause(): boolean {
        return this._player?.pause(true)
    }

    public resume(): boolean {
        return this._player?.unpause()
    }

    public isIdle(): boolean {
        return this._player?.state.status === AudioPlayerStatus.Idle || this._voiceChannel?.members.size <= 1
    }

    public reset(): void {
        this._player?.removeAllListeners()
        this._player?.stop()
        this._player = undefined
        this._voiceConnection?.destroy()
        this._voiceConnection = undefined
        this._voiceChannel = undefined
    }
}