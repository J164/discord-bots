import { Message, MessageReaction } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { Deck } from '../../../core/modules/Deck'
import { KrenkoGuildInputManager } from '../KrenkoGuildInputManager'

interface deckInfo {
    name: string,
    image: string,
    url: string,
    // eslint-disable-next-line camelcase
    api_url: string
}

async function parseDecks(message: Message, info: KrenkoGuildInputManager, decks: deckInfo[], i = 0): Promise<void> {
    const deck = new Deck()
    deck.fill(decks[i])
    const menu = await message.channel.send(deck.getPreview())
    const emojiList = [ '\uD83D\uDCC4', '\u274C' ]
    if (i !== 0) {
        emojiList.unshift('\u2B05\uFE0F')
    }
    if (i !== decks.length - 1) {
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
            parseDecks(message, info, decks, i - 1)
            return
        case '\u27A1\uFE0F':
            await menu.delete()
            parseDecks(message, info, decks, i + 1)
            return
        default:
            menu.delete()
    }
}

async function getDecks(message: Message, info: KrenkoGuildInputManager): Promise<void> {
    info.database.select('decks', results => {
        parseDecks(message, info, <deckInfo[]> results)
    })
}

module.exports = new BaseCommand([ 'getdecks', 'decks' ], getDecks)