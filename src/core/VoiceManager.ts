import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, demuxProbe, entersState, joinVoiceChannel, PlayerSubscription, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice'
import { VoiceChannel } from 'discord.js'
import { createReadStream } from 'fs'

export class VoiceManager {

    private voiceConnection: VoiceConnection
    private subscription: PlayerSubscription
    protected player: AudioPlayer
    protected awaitingResource: boolean

    public constructor() {
        this.awaitingResource = false
    }

    public async connect(voiceChannel: VoiceChannel): Promise<boolean> {
        if (this.player?.state.status === AudioPlayerStatus.Idle) {
            return true
        }
        if (this.player) {
            return false
        }
        this.voiceConnection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator
        })
        try {
            await entersState(this.voiceConnection, VoiceConnectionStatus.Ready, 30e3)
            this.player = createAudioPlayer()
            this.subscription = this.voiceConnection.subscribe(this.player)
            return true
        } catch (err) {
            console.log(err)
            this.reset()
            return false
        }
    }

    public async createStream(path: string): Promise<boolean> {
        const { stream, type } = await demuxProbe(createReadStream(path, { highWaterMark: 250 }))
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

    public checkIsIdle(): void {
        if (this.player?.state.status === AudioPlayerStatus.Idle && this.awaitingResource === false) {
            this.reset()
        }
    }

    public reset(): void {
        this.voiceConnection?.destroy()
        this.voiceConnection = null
        this.player?.removeAllListeners()
        this.player?.stop(true)
        this.player = null
        this.subscription?.unsubscribe()
        this.subscription = null
    }
}