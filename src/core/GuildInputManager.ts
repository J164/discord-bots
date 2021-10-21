import { Collection, CommandInteraction, InteractionReplyOptions, Message } from 'discord.js'
import { QueueManager } from './voice/QueueManager'
import { BaseCommand } from './BaseCommand'
import { DatabaseManager } from './DatabaseManager'
import { BaseMagicGame } from './modules/games/BaseMagicGame'
import { VoiceManager } from './voice/VoiceManager'

export class GuildInputManager {

    private readonly commands: Collection<string, BaseCommand>
    public readonly database: DatabaseManager
    public readonly voiceManager: VoiceManager
    public readonly queueManager: QueueManager
    public readonly parseMessage: (message: Message) => void
    public game: BaseMagicGame

    public constructor(commands: Collection<string, BaseCommand>, options?: { parseMessage?: (message: Message) => void, database?: DatabaseManager, voiceManager?: VoiceManager, queueManager?: QueueManager }) {
        this.commands = commands
        this.parseMessage = options?.parseMessage
        this.database = options?.database
        this.voiceManager = options?.voiceManager
        this.queueManager = options?.queueManager
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

        return command.execute(interaction, this)
    }
}