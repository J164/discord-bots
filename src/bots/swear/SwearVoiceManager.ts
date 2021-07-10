import { VoiceManager } from "../../core/VoiceManager"

export class SwearVoiceManager extends VoiceManager {

    public constructor() {
        super()
    }

    public defineDispatcherFinish(): void {
        this.streamDispatcher.once('finish', () => {
            this.streamDispatcher.destroy()
            this.playing = false
        })
    }

    public destroyDispatcher(): void {
        this.streamDispatcher?.destroy()
    }

}