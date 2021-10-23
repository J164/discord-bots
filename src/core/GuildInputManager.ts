import { Collection, CommandInteraction, InteractionReplyOptions, Message } from 'discord.js'
import { QueueManager } from './voice/QueueManager'
import { BaseCommand } from './BaseCommand'
import { DatabaseManager } from './DatabaseManager'
import { VoiceManager } from './voice/VoiceManager'
import { GuildInfo } from './utils/interfaces'

export class GuildInputManager {

    private readonly commands: Collection<string, BaseCommand>
    public readonly parseMessage: (message: Message) => void
    public readonly info: GuildInfo

    public constructor(commands: Collection<string, BaseCommand>, options?: { parseMessage?: (message: Message) => void, database?: DatabaseManager, voiceManager?: VoiceManager, queueManager?: QueueManager }) {
        this.commands = commands
        this.parseMessage = options?.parseMessage
        this.info = { database: options?.database, voiceManager: options?.voiceManager, queueManager: options?.queueManager }
    }

    public async parseCommand(interaction: CommandInteraction): Promise<InteractionReplyOptions | void> {
        await interaction.deferReply()

        const command = this.commands.get(interaction.commandName)

        if (!command) {
            return { content: 'Command not recognized (Please wait a few minutes and try again)' }
        }

        const channel = await interaction.client.channels.fetch(interaction.channelId)
        if (!channel.isText()) {
            return
        }

        if (channel.type !== 'GUILD_TEXT') {
            return { content: 'Please only use slash commands in servers!' }
        }

        return command.execute(interaction, this.info)
    }
}