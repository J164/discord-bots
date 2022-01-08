import { ApplicationCommandData, ApplicationCommandOptionChoice, AutocompleteInteraction, Client, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { QueueManager } from './voice/queue-manager.js'
import { DatabaseManager } from './database-manager.js'
import { VoiceManager } from './voice/voice-manager.js'
import { Command, GuildInfo } from './utils/interfaces.js'
import { BaseGame } from './utils/base-game.js'
import { generateEmbed } from './utils/generators.js'
import { readdirSync } from 'node:fs'

export class InteractionManager {

    private readonly _commands: Map<string, Command>
    private readonly _database?: DatabaseManager
    private readonly _info: Map<string, GuildInfo>

    public constructor(database?: DatabaseManager) {
        this._commands = new Map<string, Command>()
        this._database = database
        this._info = new Map<string, GuildInfo>()
    }

    public async getCommands(client: Client, botName: string): Promise<void> {
        const currentCommands = await client.application.commands.fetch()
        for (const [ , slash ] of currentCommands) {
            try {
                const { command } = await import(`../commands/${botName}/${slash.name}.js`)
                this._commands.set(slash.name, <Command> command)
            } catch {
                console.warn(`Registered command missing from ${botName}'s command files (${slash.name})`)
            }
        }
    }

    public static async deployCommands(client: Client, botName: string): Promise<void> {
        const commandData: ApplicationCommandData[] = []
        for (const slash of readdirSync(`./dist/commands/${botName}`).filter(file => file.endsWith('.js'))) {
            const { command } = await import(`../commands/${botName}/${slash}`)
            commandData.push((<Command> command).data)
        }
        await client.application.commands.set(commandData)
    }

    public async parseCommand(interaction: CommandInteraction): Promise<InteractionReplyOptions | void> {
        const command = this._commands.get(interaction.commandName)

        await interaction.deferReply({ ephemeral: command.ephemeral })

        const channel = await interaction.client.channels.fetch(interaction.channelId)

        if (command.gameCommand) {
            if (channel.type !== 'GUILD_PUBLIC_THREAD') {
                return { embeds: [ generateEmbed('error', { title: 'Please only use game commands in game threads!' }) ] }
            }
        } else if (channel.type !== 'GUILD_TEXT') {
            return { embeds: [ generateEmbed('error', { title: 'Please only use slash commands in servers!' }) ] }
        }

        if (this._database?.offline) {
            await this._database.connect()
        }

        return command.execute(interaction, this._info.get(interaction.guildId))
    }

    public addGuild(guildId: string, options?: { voiceManager?: VoiceManager, queueManager?: QueueManager }): void {
        if (!this._info.has(guildId)) {
            this._info.set(guildId, { database: this._database, voiceManager: options?.voiceManager, queueManager: options?.queueManager, games: new Map<string, BaseGame>() })
        }
    }

    public async autocomplete(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoice[]> {
        return await this._commands.get(interaction.commandName)?.autocomplete(interaction.options.getFocused(true), this._info.get(interaction.guildId)) ?? []
    }

    public statusCheck(): void {
        for (const [ , guild ] of this._info) {
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