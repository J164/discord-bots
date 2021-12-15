import { ApplicationCommandOptionChoice, AutocompleteInteraction, Client, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { QueueManager } from './voice/QueueManager.js'
import { DatabaseManager } from './DatabaseManager.js'
import { VoiceManager } from './voice/VoiceManager.js'
import { Command, GuildInfo } from './utils/interfaces.js'
import { BaseGame } from './utils/BaseGame.js'
import { generateEmbed } from './utils/generators.js'

export class InteractionManager {

    private readonly commands: Map<string, Command>
    private readonly database?: DatabaseManager
    private readonly info: Map<string, GuildInfo>

    public constructor(database?: DatabaseManager) {
        this.commands = new Map<string, Command>()
        this.database = database
        this.info = new Map<string, GuildInfo>()
    }

    public async getCommands(client: Client, botName: string): Promise<void> {
        const currentCommands = await client.application.commands.fetch()
        for (const [ , slash ] of currentCommands) {
            try {
                const { command } = await import(`../bots/${botName}/commands/${slash.name}.js`)
                this.commands.set(slash.name, command)
            } catch {
                console.warn(`Registered command missing from ${botName}'s command files (${slash.name})`)
            }
        }
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

        if (this.database?.offline) {
            await this.database.connect()
        }

        return command.execute(interaction, this.info.get(interaction.guildId))
    }

    public addGuild(guildId: string, options?: { voiceManager?: VoiceManager, queueManager?: QueueManager }): void {
        if (!this.info.has(guildId)) {
            this.info.set(guildId, { database: this.database, voiceManager: options?.voiceManager, queueManager: options?.queueManager, games: new Map<string, BaseGame>() })
        }
    }

    public async autocomplete(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoice[]> {
        return await this.commands.get(interaction.commandName)?.autocomplete(interaction.options.getFocused(true), this.info.get(interaction.guildId)) ?? []
    }

    public statusCheck(): void {
        for (const [ , guild ] of this.info) {
            if (guild.voiceManager?.isIdle()) {
                guild.voiceManager.reset()
            }
            if (guild.queueManager?.isIdle()) {
                guild.queueManager.reset()
            }
            for (const [ id, game ] of guild.games) {
                if (game.isOver()) {
                    guild.games.delete(id)
                }
            }
        }
    }
}