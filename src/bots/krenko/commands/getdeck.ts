import { ApplicationCommandData, ButtonInteraction, CollectorFilter, CommandInteraction, InteractionCollector, InteractionReplyOptions, MessageActionRow, MessageButton } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { DeckInfo } from '../../../core/interfaces'
import { Deck } from '../../../core/modules/Deck'
import { KrenkoGuildInputManager } from '../KrenkoGuildInputManager'

const data: ApplicationCommandData = {
    name: 'getdeck',
    description: 'Get a deck from Krenko\'s database'
}

async function parseDeck(interaction: CommandInteraction, info: KrenkoGuildInputManager, decks: DeckInfo[], button: ButtonInteraction = null, i = 0): Promise<void> {
    const deck = new Deck()
    deck.fill(decks[i])
    const components = [ new MessageButton({ customId: 'getdeck-doublearrowleft', emoji: '\u23EA', label: 'Return to Beginning', style: 'SECONDARY' }),
                         new MessageButton({ customId: 'getdeck-arrowleft', emoji: '\u2B05\uFE0F', label: 'Previous Page', style: 'SECONDARY' }),
                         new MessageButton({ customId: 'getdeck-list', emoji: '\uD83D\uDCC4', label: 'Decklist', style: 'PRIMARY' }),
                         new MessageButton({ customId: 'getdeck-arrowright', emoji: '\u27A1\uFE0F', label: 'Next Page', style: 'SECONDARY' }),
                         new MessageButton({ customId: 'getdeck-doublearrowright', emoji: '\u23E9', label: 'Jump to End', style: 'SECONDARY' }) ]
    if (i === 0) {
        components[0].setDisabled(true)
        components[1].setDisabled(true)
    }
    if (i === decks.length - 1) {
        components[3].setDisabled(true)
        components[4].setDisabled(true)
    }
    const row1 = new MessageActionRow().addComponents(components)
    const options: InteractionReplyOptions = { embeds: [ deck.getPreview().setFooter(`${i + 1}/${decks.length}`) ], components: [ row1 ] }
    if (!button) {
        await interaction.editReply(options)
    } else {
        await button.update(options)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: CollectorFilter<[any]> = b => b.user.id === interaction.member.user.id && b.customId.startsWith(interaction.commandName)
    const collector = <InteractionCollector<ButtonInteraction>> interaction.channel.createMessageComponentCollector({ filter: filter, time: 60000 })
    collector.once('collect', async b => {
        switch (b.customId) {
            case 'getdeck-doublearrowleft':
                parseDeck(interaction, info, decks, b)
                break
            case 'getdeck-arrowleft':
                parseDeck(interaction, info, decks, b, i - 1)
                break
            case 'getdeck-list':
                try {
                    b.update({ content: await deck.getList(), embeds: [], components: [] })
                } catch {
                    b.update({ content: 'There seems to be something wrong with the Deckstats API at the moment. Try again later', embeds: [], components: [] })
                }
                break
            case 'getdeck-arrowright':
                parseDeck(interaction, info, decks, b, i + 1)
                break
            case 'getdeck-doublearrowright':
                parseDeck(interaction, info, decks, b, decks.length - 1)
                break
            default:
                break
        }
    })
    collector.once('end', () => { interaction.editReply({ components: [] }) })
}

function getDeck(interaction: CommandInteraction, info: KrenkoGuildInputManager): void {
    info.database.select('decks', results => {
        parseDeck(interaction, info, <DeckInfo[]> results)
    })
}

module.exports = new BaseCommand(data, getDeck)