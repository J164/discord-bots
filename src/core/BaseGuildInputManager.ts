import { Collection, CommandInteraction, Guild, GuildMember, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from './BaseCommand'

export abstract class BaseGuildInputManager {

    private readonly guild: Guild
    public readonly users: Map<string, GuildMember>
    private readonly commands: Collection<string, BaseCommand>

    public constructor(guild: Guild, commands: Collection<string, BaseCommand>) {
        this.guild = guild
        this.users = new Map<string, GuildMember>()
        this.commands = commands
        this.getUsers()
    }

    public async parseCommand(interaction: CommandInteraction): Promise<InteractionReplyOptions | void> {
        await interaction.defer()

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

    private async getUsers(): Promise<void> {
        this.users.set('admin', await this.guild.members.fetch({ user: '609826125501169723' }))
        if (this.guild.id === '619975185029922817' || this.guild.id === '793330937035096134') {
            this.users.set('swear', await this.guild.members.fetch({ user: '633046187506794527' }))
        }
    }
}