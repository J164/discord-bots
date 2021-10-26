import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { QueueManager } from './voice/QueueManager'
import { DatabaseManager } from './DatabaseManager'
import { VoiceManager } from './voice/VoiceManager'
import { Command, GuildInfo } from './utils/interfaces'

export class GuildInputManager {

    private readonly commands: Map<string, Command>
    private readonly info: GuildInfo

    public constructor(commands: Map<string, Command>, options?: { database?: DatabaseManager, voiceManager?: VoiceManager, queueManager?: QueueManager }) {
        this.commands = commands
        this.info = { database: options?.database, voiceManager: options?.voiceManager, queueManager: options?.queueManager }
    }

    public async parseCommand(interaction: CommandInteraction): Promise<InteractionReplyOptions | void> {
        await interaction.deferReply()

        const command = this.commands.get(interaction.commandName)

        if (!command) {
            return { content: 'Command not recognized (Please wait a few minutes and try again)' }
        }

        const channel = await interaction.client.channels.fetch(interaction.channelId)

        if (channel.type !== 'GUILD_TEXT') {
            return { content: 'Please only use slash commands in servers!' }
        }

        return command.execute(interaction, this.info)
    }

    public statusCheck(): void {
        this.info.voiceManager?.checkIsIdle()
        this.info.queueManager?.voiceManager.checkIsIdle()
    }

    public reset(): void {
        this.info.voiceManager?.reset()
        this.info.queueManager?.reset()
    }
}