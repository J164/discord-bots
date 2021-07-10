import { Guild, Client, GuildMember, Message, MessageEmbed } from 'discord.js'

export abstract class BaseGuildInputManager {

    protected readonly guild: Guild
    protected readonly client: Client
    protected readonly users: Map<string, GuildMember>

    public constructor(guild: Guild, client: Client) {
        this.guild = guild
        this.client = client
        this.users = new Map<string, GuildMember>()
    }

    public parseInput(message: Message): Promise<MessageEmbed | string | void> {
        console.log(message)
        return null
    }

    protected async getUsers(): Promise<void> {
        this.users.set('admin', await this.guild.members.fetch({ user: '609826125501169723' }))
        if (this.guild.id === '619975185029922817' || this.guild.id === '793330937035096134') {
            this.users.set('swear', await this.guild.members.fetch({ user: '633046187506794527' }))
        }
    }
}