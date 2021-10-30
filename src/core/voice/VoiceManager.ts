import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, demuxProbe, entersState, joinVoiceChannel, PlayerSubscription, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice'
import { VoiceChannel } from 'discord.js'
import { Readable } from 'stream'

export class VoiceManager {

    private voiceConnection: VoiceConnection
    private subscription: PlayerSubscription
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
            this.subscription = this.voiceConnection.subscribe(this.player)
            this.voiceConnection.once('stateChange', () => {
                this.reset()
            })
            return true
        } catch (err) {
            console.log(err)
            this.reset()
            return false
        }
    }

    public async playStream(stream: Readable): Promise<boolean> {
        const { type } = await demuxProbe(stream)
        this.player.play(createAudioResource(stream, { inputType: type }))
        try {
            await entersState(this.player, AudioPlayerStatus.Playing, 30e3)
        } catch (err) {
            console.log(err)
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

    public checkIsIdle(): void {
        if (this.player?.state.status === AudioPlayerStatus.Idle || this.voiceChannel?.members.size <= 1) {
            this.reset()
        }
    }

    public reset(): void {
        this.voiceConnection?.removeAllListeners()
        this.voiceConnection?.destroy()
        this.voiceConnection = null
        this.player?.removeAllListeners()
        this.player?.stop(true)
        this.player = null
        this.subscription?.unsubscribe()
        this.subscription = null
    }
}