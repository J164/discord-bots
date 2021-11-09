import { ApplicationCommandData, ButtonInteraction, CollectorFilter, CommandInteraction, InteractionCollector, InteractionReplyOptions, MessageActionRow, MessageButton } from 'discord.js'
import { GuildInfo } from '../../../core/utils/interfaces'
import { Deck } from '../../../core/modules/Deck'

const data: ApplicationCommandData = {
    name: 'decks',
    description: 'Get a deck from Krenko\'s database'
}

interface DeckInfo {
    readonly name: string,
    readonly image: string,
    readonly url: string,
    readonly api_url: string
}

async function parseDeck(interaction: CommandInteraction, info: GuildInfo, decks: DeckInfo[], button: ButtonInteraction = null, i = 0): Promise<void> {
    const deck = new Deck()
    deck.fill(decks[i])
    const components = [ new MessageButton({ customId: 'decks-doublearrowleft', emoji: '\u23EA', label: 'Return to Beginning', style: 'SECONDARY' }),
                         new MessageButton({ customId: 'decks-arrowleft', emoji: '\u2B05\uFE0F', label: 'Previous Page', style: 'SECONDARY' }),
                         new MessageButton({ customId: 'decks-list', emoji: '\uD83D\uDCC4', label: 'Decklist', style: 'PRIMARY' }),
                         new MessageButton({ customId: 'decks-arrowright', emoji: '\u27A1\uFE0F', label: 'Next Page', style: 'SECONDARY' }),
                         new MessageButton({ customId: 'decks-doublearrowright', emoji: '\u23E9', label: 'Jump to End', style: 'SECONDARY' }) ]
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
            case 'decks-doublearrowleft':
                parseDeck(interaction, info, decks, b)
                break
            case 'decks-arrowleft':
                parseDeck(interaction, info, decks, b, i - 1)
                break
            case 'decks-list':
                try {
                    b.update({ content: await deck.getList(), embeds: [], components: [] })
                } catch {
                    b.update({ content: 'There seems to be something wrong with the Deckstats API at the moment. Try again later', embeds: [], components: [] })
                }
                break
            case 'decks-arrowright':
                parseDeck(interaction, info, decks, b, i + 1)
                break
            case 'decks-doublearrowright':
                parseDeck(interaction, info, decks, b, decks.length - 1)
                break
            default:
                break
        }
    })
    collector.once('end', () => { interaction.editReply({ components: [] }) })
}

function getDeck(interaction: CommandInteraction, info: GuildInfo): void {
    info.database.select('decks', results => {
        parseDeck(interaction, info, <DeckInfo[]> results)
    })
}

module.exports = { data: data, execute: getDeck }