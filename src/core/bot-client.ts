import { ApplicationCommandOptionChoice, AutocompleteInteraction, Client, ClientOptions, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { QueueManager } from './voice/queue-manager.js'
import { DatabaseManager } from './database-manager.js'
import { VoiceManager } from './voice/voice-manager.js'
import { GuildInfo } from './utils/interfaces.js'
import { generateEmbed } from './utils/generators.js'
import { BaseGame } from './utils/base-game.js'
import { ChatCommand } from './utils/command-types/chat-command.js'
import { setInterval } from 'node:timers'

interface GuildOptions {
    readonly voiceManager?: boolean,
    readonly queueManager?: boolean
}

export class BotClient extends Client {

    private readonly _name: string
    private readonly _status: string[]
    private readonly _database?: DatabaseManager
    private readonly _info: Map<string, GuildInfo>

    public constructor(clientOptions: ClientOptions, botOptions: { readonly name: string, readonly status: string[], readonly guildOptions: GuildOptions, readonly database?: boolean }) {
        super(clientOptions)
        this._name = botOptions.name
        this._status = botOptions.status
        this._database = botOptions.database ? new DatabaseManager() : undefined
        this._info = new Map<string, GuildInfo>()
        this.once('ready', () => { this.ready() })
        this.on('interactionCreate', async interaction => {
            if (interaction.inGuild() && !this._info.has(interaction.guildId)) {
                this.addGuild(interaction.guildId, botOptions.guildOptions)
            }

            if (interaction.isAutocomplete()) {
                const response = await this.autocomplete(interaction)
                try { void interaction.respond(response) } catch { /* prevent unknown interaction */ }
                return
            }

            if (!interaction.isCommand()) {
                return
            }

            const response = await this.parseChatCommand(interaction)
            if (response) {
                void interaction.editReply(response)
            }
        })
    }

    public ready(): void {
        this.user.setStatus('dnd')
        this.user.setActivity(this._status[Math.floor(Math.random() * this._status.length)])

        setInterval(() => {
            this.user.setActivity(this._status[Math.floor(Math.random() * this._status.length)])
            this.statusCheck()
        }, 300_000)

        this.user.setStatus('online')
        console.log(`\u001B[42m We have logged in as ${this.user.tag} \u001B[0m`)
    }

    public async parseChatCommand(interaction: CommandInteraction): Promise<InteractionReplyOptions | void> {
        const command = (await import(`../commands/${this._name}/${interaction.commandName}.js`) as { command: ChatCommand }).command

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

    public async autocomplete(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoice[]> {
        const command = (await import(`../commands/${this._name}/${interaction.commandName}.js`) as { command: ChatCommand }).command
        if (command.isGuildOnly()) {
            if (!interaction.inGuild()) {
                return []
            }
            return (await command.autocomplete(interaction.options.getFocused(true), { ...this._info.get(interaction.guildId), database: this._database })) ?? []
        }
        return (await command.autocomplete(interaction.options.getFocused(true), { database: this._database })) ?? []
    }

    public addGuild(guildId: string, options: GuildOptions): void {
        this._info.set(guildId, {
            voiceManager: options.voiceManager ? new VoiceManager() : undefined,
            queueManager: options.queueManager ? new QueueManager() : undefined,
            games: new Map<string, BaseGame>(),
        })
    }

    public statusCheck(): void {
        for (const [ , guild ] of this._info) {
            if (guild.voiceManager?.isIdle()) {
                guild.voiceManager.reset()
            }
            if (guild.queueManager?.isIdle()) {
                void guild.queueManager.reset()
            }
            for (const [ id, game ] of guild.games) {
                if (game.over) {
                    guild.games.delete(id)
                }
            }
        }
    }
}