import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, demuxProbe, entersState, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice'
import { VoiceChannel } from 'discord.js'
import { Readable } from 'stream'

export class VoiceManager {

    private voiceConnection: VoiceConnection
    private voiceChannel: VoiceChannel
    public player: AudioPlayer

    public async connect(voiceChannel: VoiceChannel): Promise<boolean> {
        if (this.voiceConnection?.state.status === VoiceConnectionStatus.Ready) {
            return true
        }
        this.voiceConnection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator
        })
        this.voiceChannel = voiceChannel
        try {
            await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 30e3)
            this.player = createAudioPlayer()
            this.voiceConnection.subscribe(this.player)
            return true
        } catch (err) {
            console.warn(err)
            this.reset()
            return false
        }
    }

    public async playStream(originalStream: Readable): Promise<boolean> {
        const { type, stream } = await demuxProbe(originalStream)
        this.player.play(createAudioResource(stream, { inputType: type }))
        try {
            await entersState(this.player, AudioPlayerStatus.Playing, 30e3)
        } catch (err) {
            console.warn(err)
            return false
        }
        return true
    }

    public pause(): boolean {
        return this.player?.pause(true)
    }

    public resume(): boolean {
        return this.player?.unpause()
    }

    public isActive(): boolean {
        return this.player?.state.status === AudioPlayerStatus.Playing || this.player?.state.status === AudioPlayerStatus.Paused
    }

    public isIdle(): boolean {
        return this.player?.state.status === AudioPlayerStatus.Idle || this.voiceChannel?.members.size <= 1
    }

    public reset(): void {
        this.voiceConnection?.removeAllListeners()
        this.voiceConnection?.destroy()
        this.voiceConnection = null
        this.player?.removeAllListeners()
        this.player?.stop()
        this.player = null
        this.voiceChannel = null
    }
}