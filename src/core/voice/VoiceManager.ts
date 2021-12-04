import { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, demuxProbe, entersState, joinVoiceChannel, PlayerSubscription, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice'
import { InteractionReplyOptions, VoiceChannel } from 'discord.js'
import { createReadStream } from 'fs'
import { Readable } from 'stream'
import { generateEmbed } from '../utils/commonFunctions'

export class VoiceManager {

    private voiceConnection: VoiceConnection
    private subscription: PlayerSubscription
    private voiceChannel: VoiceChannel
    private looping: boolean
    private currentPath: string
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
            return true
        } catch (err) {
            console.warn(err)
            this.reset()
            return false
        }
    }

    public async playStream(stream: Readable, path?: string): Promise<boolean> {
        this.looping = false
        this.currentPath = path
        const { type } = await demuxProbe(stream)
        this.player.play(createAudioResource(stream, { inputType: type }))
        try {
            await entersState(this.player, AudioPlayerStatus.Playing, 30e3)
        } catch (err) {
            console.warn(err)
            return false
        }
        return true
    }

    public loop(): InteractionReplyOptions {
        if (!this.isActive()) {
            return { embeds: [ generateEmbed('error', { title: 'Nothing is playing!' }) ] }
        }
        if (!this.looping) {
            this.player.on('stateChange', (oldState, newState) => {
                if (newState.status !== AudioPlayerStatus.Idle) {
                    return
                }
                this.playStream(createReadStream(this.currentPath), this.currentPath)
            })
            this.looping = true
            return { embeds: [ generateEmbed('success', { title: 'Now Looping!' }) ] }
        }
        this.player.removeAllListeners('stateChange')
        this.looping = false
        return { embeds: [ generateEmbed('success', { title: 'No longer looping!' }) ] }
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
        this.subscription?.unsubscribe()
        this.subscription = null
    }
}