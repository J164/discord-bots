import { ApplicationCommandData, ApplicationCommandOptionChoice, AutocompleteInteraction, Client, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { QueueManager } from './voice/queue-manager.js'
import { DatabaseManager } from './database-manager.js'
import { VoiceManager } from './voice/voice-manager.js'
import { GuildInfo } from './utils/interfaces.js'
import { generateEmbed } from './utils/generators.js'
import { readdirSync } from 'node:fs'
import { BaseGame } from './utils/base-game.js'
import { BaseCommand } from './utils/command-types/base-command.js'
import { ChatCommand } from './utils/command-types/chat-command.js'

export class InteractionManager {

    private readonly _commands: Map<string, BaseCommand>
    private readonly _database?: DatabaseManager
    private readonly _info: Map<string, GuildInfo>

    public constructor(database?: DatabaseManager) {
        this._commands = new Map<string, BaseCommand>()
        this._database = database
        this._info = new Map<string, GuildInfo>()
    }

    public async getCommands(client: Client, botName: string): Promise<void> {
        const currentCommands = await client.application.commands.fetch()
        for (const [ , slash ] of currentCommands) {
            try {
                const { command } = await import(`../commands/${botName}/${slash.name}.js`) as { command: BaseCommand }
                this._commands.set(slash.name, command)
            } catch {
                console.warn(`Registered command missing from ${botName}'s command files (${slash.name})`)
            }
        }
    }

    public static async deployCommands(client: Client, botName: string): Promise<void> {
        const commandData: ApplicationCommandData[] = []
        for (const slash of readdirSync(`./dist/commands/${botName}`).filter(file => file.endsWith('.js'))) {
            const { command } = await import(`../commands/${botName}/${slash}`) as { command: BaseCommand }
            commandData.push(command.data)
        }
        await client.application.commands.set(commandData)
    }

    public async parseChatCommand(interaction: CommandInteraction): Promise<InteractionReplyOptions | void> {
        const command = this._commands.get(interaction.commandName) as ChatCommand

        await interaction.deferReply({ ephemeral: command.ephemeral })

        if (this._database?.offline) {
            await this._database.connect()
        }

        if (command.isGuildOnly()) {
            if (!interaction.inGuild()) {
                return { embeds: [ generateEmbed('error', { title: 'Please only use this command in servers!' }) ] }
            }
            if (command.gameCommand && (this._info.get(interaction.guildId).games.get(interaction.channelId)?.type !== command.gameCommand || this._info.get(interaction.guildId).games.get(interaction.channelId)?.over)) {
                return { embeds: [ generateEmbed('error', { title: `Please only use this command in ${command.gameCommand} threads!` }) ] }
            }
            return command.respond(interaction, { ...this._info.get(interaction.guildId), database: this._database })
        }

        return command.respond(interaction, { database: this._database })
    }

    public addGuild(guildId: string, options?: { voiceManager?: VoiceManager, queueManager?: QueueManager }): void {
        if (!this._info.has(guildId)) {
            this._info.set(guildId, { voiceManager: options?.voiceManager, queueManager: options?.queueManager, games: new Map<string, BaseGame>() })
        }
    }

    public async autocomplete(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoice[]> {
        const command = this._commands.get(interaction.commandName) as ChatCommand
        if (command.isGuildOnly()) {
            if (!interaction.inGuild()) {
                return []
            }
            return (await command.autocomplete(interaction.options.getFocused(true), { ...this._info.get(interaction.guildId), database: this._database })) ?? []
        }
        return (await command.autocomplete(interaction.options.getFocused(true), { database: this._database })) ?? []
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
                if (game.over) {
                    guild.games.delete(id)
                }
            }
        }
    }
}