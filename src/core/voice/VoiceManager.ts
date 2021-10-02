import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, demuxProbe, entersState, joinVoiceChannel, PlayerSubscription, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice'
import { VoiceChannel } from 'discord.js'
import { createReadStream } from 'fs'

export class VoiceManager {

    private voiceConnection: VoiceConnection
    private subscription: PlayerSubscription
    private voiceChannel: VoiceChannel
    protected player: AudioPlayer
    protected awaitingResource: boolean

    public constructor() {
        this.awaitingResource = false
    }

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
        // eslint-disable-next-line no-extra-parens
        if ((this.player?.state.status === AudioPlayerStatus.Idle && this.awaitingResource === false) || this.voiceChannel?.members.size <= 1) {
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