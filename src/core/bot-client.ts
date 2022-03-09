import { ApplicationCommandOptionChoice, AutocompleteInteraction, Client, ClientOptions, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { QueueManager } from './voice/queue-manager.js'
import { DatabaseManager } from './database-manager.js'
import { VoiceManager } from './voice/voice-manager.js'
import { GuildInfo } from './utils/interfaces.js'
import { generateEmbed } from './utils/generators.js'
import { ChatCommand } from './utils/command-types/chat-command.js'

interface GuildOptions {
    readonly voiceManager?: boolean,
    readonly queueManager?: boolean
}

export class BotClient extends Client {

    private readonly _name: string
    private readonly _guildOptions: GuildOptions
    private readonly _database?: DatabaseManager
    private readonly _info: Map<string, GuildInfo>

    public constructor(clientOptions: ClientOptions, botOptions: { readonly name: string, readonly status: string[], readonly guildOptions: GuildOptions, readonly database?: boolean }) {
        super(clientOptions)

        this._name = botOptions.name
        this._guildOptions = botOptions.guildOptions
        this._database = botOptions.database ? new DatabaseManager() : undefined
        this._info = new Map<string, GuildInfo>()

        this.once('ready', () => { void this.ready(botOptions.status) })
    }

    private async ready(status: string[]): Promise<void> {
        this.user.setStatus('dnd')
        this.user.setActivity(status[Math.floor(Math.random() * status.length)])

        await this._database?.connect()

        this.on('interactionCreate', async interaction => {
            if (interaction.inGuild() && !this._info.has(interaction.guildId)) {
                this.addGuild(interaction.guildId)
            }

            if (interaction.isAutocomplete()) {
                void interaction.respond(await this.autocomplete(interaction)
                    .catch(error => {
                        console.log(error)
                        return []
                    }),
                ).catch()
                return
            }

            if (!interaction.isCommand()) return

            void interaction.editReply(await this.parseChatCommand(interaction)
                .catch(error => {
                    console.log(error)
                    return { embeds: [ generateEmbed('error', { title: 'Something went wrong!' }) ] }
                }) ?? {},
            ).catch()
        })

        this.user.setStatus('online')
        console.log(`\u001B[42m We have logged in as ${this.user.tag} \u001B[0m`)
    }

    private async parseChatCommand(interaction: CommandInteraction): Promise<InteractionReplyOptions> {
        const command = (await import(`../commands/${this._name}/${interaction.commandName}.js`) as { command: ChatCommand }).command

        await interaction.deferReply({ ephemeral: command.ephemeral })

        if (command.isGuildOnly()) {
            if (!interaction.inGuild()) {
                return { embeds: [ generateEmbed('error', { title: 'Please only use this command in servers!' }) ] }
            }
            return command.respond(interaction, { ...this._info.get(interaction.guildId), database: this._database })
        }

        return command.respond(interaction, { database: this._database })
    }

    private async autocomplete(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoice[]> {
        const command = (await import(`../commands/${this._name}/${interaction.commandName}.js`) as { command: ChatCommand }).command
        if (command.isGuildOnly()) {
            if (!interaction.inGuild()) {
                return []
            }
            return (await command.autocomplete(interaction.options.getFocused(true), { ...this._info.get(interaction.guildId), database: this._database })) ?? []
        }
        return (await command.autocomplete(interaction.options.getFocused(true), { database: this._database })) ?? []
    }

    private addGuild(guildId: string): void {
        this._info.set(guildId, {
            voiceManager: this._guildOptions.voiceManager ? new VoiceManager() : undefined,
            queueManager: this._guildOptions.queueManager ? new QueueManager() : undefined,
        })
    }
}