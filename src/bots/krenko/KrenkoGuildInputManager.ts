import { Guild, Message, MessageEmbed } from 'discord.js'
import { BaseGuildInputManager } from '../../core/BaseGuildInputManager'
import { DatabaseManager } from '../../core/DatabaseManager'
import { BaseMagicGame } from '../../core/modules/games/BaseMagicGame'

export class KrenkoGuildInputManager extends BaseGuildInputManager {

    private static readonly prefix = '$'
    public game: BaseMagicGame

    public constructor(guild: Guild, database: DatabaseManager) {
        super(guild, database, 'krenko')
    }

    public async parseInput(message: Message): Promise<MessageEmbed | string | void> {
        if (!message.content.startsWith(KrenkoGuildInputManager.prefix) || message.author.bot || !message.guild) {
            return
        }

        return this.parseCommand(message)
    }
}