import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, entersState, joinVoiceChannel, PlayerSubscription, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice'
import { VoiceChannel } from 'discord.js'

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
        this.player.play(createAudioResource(path))
        try {
            await entersState(this.player, AudioPlayerStatus.Playing, 30e3)
        } catch (err) {
            console.log(err)
            return false
        }
        return true
    }

    public pause(): boolean {
        if (this.player?.state.status !== AudioPlayerStatus.Playing) {
            return false
        }
        this.player.pause(true)
        return true
    }

    public resume(): boolean {
        if (this.player?.state.status !== AudioPlayerStatus.Paused) {
            return false
        }
        this.player.unpause()
        return true
    }

    public checkIsIdle(): void {
        if (this.player?.state.status === AudioPlayerStatus.Idle && this.awaitingResource === false) {
            this.reset()
        }
    }

    public reset(): void {
        this.voiceConnection?.destroy()
        this.voiceConnection = null
        this.player?.stop(true)
        this.player = null
        this.subscription.unsubscribe()
        this.subscription = null
    }
}