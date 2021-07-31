import { ApplicationCommandData, CommandInteraction, InteractionReplyOptions, MessageReaction } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { clearReactions } from '../../../core/commonFunctions'
import { DeckInfo } from '../../../core/interfaces'
import { Deck } from '../../../core/modules/Deck'
import { KrenkoGuildInputManager } from '../KrenkoGuildInputManager'

const data: ApplicationCommandData = {
    name: 'getdeck',
    description: 'Get a deck from Krenko\'s database'
}

async function parseDeck(interaction: CommandInteraction, info: KrenkoGuildInputManager, decks: DeckInfo[], i = 0): Promise<InteractionReplyOptions> {
    const deck = new Deck()
    deck.fill(decks[i])
    const rawMenu = await interaction.editReply({ embeds: [ deck.getPreview().setFooter(`${i + 1}/${decks.length}`) ] })
    const menu = await interaction.channel.messages.fetch(rawMenu.id)
    const emojiList = [ '\uD83D\uDCC4', '\u274C' ]
    if (i !== 0) {
        emojiList.unshift('\u2B05\uFE0F')
        emojiList.unshift('\u23EA')
    }
    if (i !== decks.length - 1) {
        emojiList.push('\u27A1\uFE0F')
        emojiList.push('\u23E9')
    }
    const reactions: MessageReaction[] = []
    for (const emoji of emojiList) {
        reactions.push(await menu.react(emoji))
    }
    function filter(reaction: MessageReaction): boolean { return reaction.client === interaction.client }
    const reactionCollection = await menu.awaitReactions({ filter, max: 1, time: 60000 })
    const reactionResult = reactionCollection.first()
    if (!reactionResult) {
        clearReactions(reactions)
        return
    }
    switch (reactionResult.emoji.name) {
        case '\uD83D\uDCC4':
            await clearReactions(reactions)
            interaction.editReply({ content: await deck.getList(), embeds: [] })
            return
        case '\u2B05\uFE0F':
            await clearReactions(reactions)
            parseDeck(interaction, info, decks, i - 1)
            return
        case '\u23EA':
            await clearReactions(reactions)
            parseDeck(interaction, info, decks)
            return
        case '\u27A1\uFE0F':
            await clearReactions(reactions)
            parseDeck(interaction, info, decks, i + 1)
            return
        case '\u23E9':
            await clearReactions(reactions)
            parseDeck(interaction, info, decks, decks.length - 1)
            return
        default:
            menu.delete()
            break
    }
}

function getDeck(interaction: CommandInteraction, info: KrenkoGuildInputManager): void {
    info.database.select('decks', results => {
        parseDeck(interaction, info, <DeckInfo[]> results)
    })
}

module.exports = new BaseCommand(data, getDeck)