import { Message, MessageReaction } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { userData } from '../../../core/common'
import { Deck } from '../../../core/modules/Deck'
import { KrenkoGuildInputManager } from '../KrenkoGuildInputManager'

async function getDecks(message: Message, info: KrenkoGuildInputManager, i = 0): Promise<void> {
    const deck = new Deck()
    deck.fill(userData.decks[i])
    const menu = await message.channel.send(deck.getPreview())
    const emojiList = [ '\uD83D\uDCC4', '\u274C' ]
    if (i !== 0) {
        emojiList.unshift('\u2B05\uFE0F')
    }
    if (i !== userData.decks.length - 1) {
        emojiList.push('\u27A1\uFE0F')
    }
    for (const emoji of emojiList) {
        await menu.react(emoji)
    }
    function filter(reaction: MessageReaction): boolean { return reaction.client === message.client }
    const reactionCollection = await menu.awaitReactions(filter, { max: 1 })
    const reactionResult = reactionCollection.first()
    switch (reactionResult.emoji.name) {
        case '\uD83D\uDCC4':
            message.reply(await deck.getList())
            menu.delete()
            return
        case '\u2B05\uFE0F':
            await menu.delete()
            getDecks(message, info, i - 1)
            return
        case '\u27A1\uFE0F':
            await menu.delete()
            getDecks(message, info, i + 1)
            return
        default:
            menu.delete()
    }
}

module.exports = new BaseCommand([ 'getdecks', 'decks' ], getDecks)