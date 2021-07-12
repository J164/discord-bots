import { StreamDispatcher, VoiceChannel, VoiceConnection } from 'discord.js'

export abstract class VoiceManager {

    protected playing: boolean
    private voiceConnection: VoiceConnection
    protected streamDispatcher: StreamDispatcher

    public constructor() {
        this.playing = false
    }

    public async connect(voiceChannel: VoiceChannel): Promise<void> {
        if (this.playing) {
            return
        }
        this.playing = true
        this.voiceConnection = await voiceChannel.join()
    }

    public createStream(path: string): void {
        this.streamDispatcher = this.voiceConnection.play(path)
    }

    public pause(): boolean {
        if (!this.streamDispatcher || this.streamDispatcher.paused) {
            return false
        }
        this.streamDispatcher.pause(true)
        return true
    }

    public resume(): boolean {
        if (!this.streamDispatcher) {
            return false
        }
        this.streamDispatcher.resume()
        return true
    }

    public checkIsIdle(): void {
        if (!this.playing) {
            this.reset()
        }
    }

    public reset(): void {
        this.playing = false
        this.voiceConnection?.disconnect()
        this.voiceConnection = null
        this.streamDispatcher?.destroy()
        this.streamDispatcher = null
    }
}