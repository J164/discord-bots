import { Guild, Message, MessageEmbed } from 'discord.js'
import { BaseGuildInputManager } from '../../core/BaseGuildInputManager'

export class KrenkoGuildInputManager extends BaseGuildInputManager {

    private static readonly prefix = '$'

    public constructor(guild: Guild) {
        super(guild, 'krenko')
    }

    public async parseInput(message: Message): Promise<MessageEmbed | string | void> {
        if (!message.content.startsWith(KrenkoGuildInputManager.prefix) || message.author.bot || !message.guild) {
            return
        }

        return this.parseCommand(message)
    }
}