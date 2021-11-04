import { ApplicationCommandOptionChoice, AutocompleteInteraction, CommandInteraction, InteractionReplyOptions } from 'discord.js'
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
            return { content: 'Command not recognized (Please contact the bot developer)' }
        }

        const channel = await interaction.client.channels.fetch(interaction.channelId)

        if (channel.type !== 'GUILD_TEXT') {
            return { content: 'Please only use slash commands in servers!' }
        }

        return command.execute(interaction, this.info)
    }

    public async autocomplete(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoice[]> {
        const focused = interaction.options.getFocused(true)
        return this.commands.get(interaction.commandName)?.autocomplete(focused.name, focused.value, this.info)
    }

    public statusCheck(): void {
        this.info.voiceManager?.checkIsIdle()
        this.info.queueManager?.voiceManager.checkIsIdle()
    }
}