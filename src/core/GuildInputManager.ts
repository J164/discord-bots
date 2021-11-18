import { ApplicationCommandOptionChoice, AutocompleteInteraction, CommandInteraction, InteractionReplyOptions, Snowflake } from 'discord.js'
import { QueueManager } from './voice/QueueManager'
import { DatabaseManager } from './DatabaseManager'
import { VoiceManager } from './voice/VoiceManager'
import { Command, GuildInfo } from './utils/interfaces'
import { BaseGame } from './modules/games/BaseGame'
import { generateEmbed } from './utils/commonFunctions'

export class GuildInputManager {

    private readonly commands: Map<string, Command>
    private readonly info: GuildInfo

    public constructor(commands: Map<string, Command>, options?: { database?: DatabaseManager, voiceManager?: VoiceManager, queueManager?: QueueManager }) {
        this.commands = commands
        this.info = { database: options?.database, voiceManager: options?.voiceManager, queueManager: options?.queueManager, games: new Map<Snowflake, BaseGame>() }
    }

    public async parseCommand(interaction: CommandInteraction): Promise<InteractionReplyOptions | void> {
        await interaction.deferReply()

        const command = this.commands.get(interaction.commandName)

        if (!command) {
            return { embeds: [ generateEmbed('error', { title: 'Command not recognized (Please contact the bot developer)' }) ] }
        }

        const channel = await interaction.client.channels.fetch(interaction.channelId)

        if (command.gameCommand) {
            if (channel.type !== 'GUILD_PUBLIC_THREAD') {
                return { embeds: [ generateEmbed('error', { title: 'Please only use game commands in game threads!' }) ] }
            }
        } else if (channel.type !== 'GUILD_TEXT') {
            return { embeds: [ generateEmbed('error', { title: 'Please only use slash commands in servers!' }) ] }
        }

        return command.execute(interaction, this.info)
    }

    public async autocomplete(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoice[]> {
        return this.commands.get(interaction.commandName)?.autocomplete(interaction.options.getFocused(true), this.info) ?? []
    }

    public statusCheck(): void {
        this.info.voiceManager?.checkIsIdle()
        this.info.queueManager?.voiceManager.checkIsIdle()
        for (const [ id, game ] of this.info.games) {
            if (game.isOver()) {
                this.info.games.delete(id)
            }
        }
    }
}