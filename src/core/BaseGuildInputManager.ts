import { Collection, Guild, GuildMember, Message, MessageEmbed } from 'discord.js'
import { readdirSync } from 'fs'
import { BaseCommand } from './BaseCommand'

export abstract class BaseGuildInputManager {

    protected readonly guild: Guild
    public readonly users: Map<string, GuildMember>
    protected readonly commands: Collection<string, BaseCommand>

    public constructor(guild: Guild, botName: string) {
        this.guild = guild
        this.users = new Map<string, GuildMember>()
        this.commands = new Collection<string, BaseCommand>()
        const commandFiles = readdirSync(`./src/bots/${botName}/commands`).filter(file => file.endsWith('.js'))

        for (const file of commandFiles) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const command = require(`../bots/${botName}/commands/${file}`)
            this.commands.set(command.aliases[0], command)
        }
    }

    public parseInput(message: Message): Promise<MessageEmbed | string | void> {
        console.log(message)
        return null
    }

    protected async parseCommand(message: Message): Promise<MessageEmbed | string | void> {
        const commandName = message.content.split(' ')[0].slice(1).toLowerCase()
        const command = this.commands.get(commandName) || this.commands.find(cmd => cmd.aliases.includes(commandName))

        if (!command) {
            return 'Command not recognized'
        }

        return command.execute(message, this)
    }

    protected async getUsers(): Promise<void> {
        this.users.set('admin', await this.guild.members.fetch({ user: '609826125501169723' }))
        if (this.guild.id === '619975185029922817' || this.guild.id === '793330937035096134') {
            this.users.set('swear', await this.guild.members.fetch({ user: '633046187506794527' }))
        }
    }
}