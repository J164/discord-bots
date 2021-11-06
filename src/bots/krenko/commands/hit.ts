import { ApplicationCommandData, CollectorFilter, CommandInteraction, InteractionCollector, InteractionReplyOptions, MessageActionRow, MessageEmbed, MessageSelectMenu, SelectMenuInteraction } from 'discord.js'
import { BaseMagicGame } from '../../../core/modules/games/BaseMagicGame'
import { CommanderMagicGame } from '../../../core/modules/games/CommanderMagicGame'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'hit',
    description: 'Deal an amount of damage to a player',
    options: [
        {
            name: 'player',
            description: 'The player to damage',
            type: 'USER',
            required: true
        },
        {
            name: 'amount',
            description: 'The amount of damage to deal',
            type: 'INTEGER',
            required: true
        },
        {
            name: 'poison',
            description: 'If the damage should result in poison counters being added',
            type: 'BOOLEAN',
            required: false
        },
        {
            name: 'commander',
            description: 'If the damage is being delt by a commander',
            type: 'BOOLEAN',
            required: false
        }
    ]
}

function hit(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    const game = info.games.get(interaction.channelId)
    if (!game || !(game instanceof BaseMagicGame) || game.isOver()) {
        return { content: 'There is currently no Magic game in this channel' }
    }
    if (!game.userInGame(interaction.options.getUser('player').id)) {
        return { content: 'That user is not part of this game!' }
    }
    let standings: MessageEmbed
    standings = game.changeLife(interaction.options.getUser('player').id, interaction.options.getInteger('amount') * -1)
    if (interaction.options.getBoolean('posion') && !game.isOver()) {
        standings = game.changePoison(interaction.options.getUser('player').id, interaction.options.getInteger('amount'))
    }
    if (interaction.options.getBoolean('commander') && game instanceof CommanderMagicGame && !game.isOver()) {
        const selectOptions: { label: string, description: string, value: string }[] = []
        for (const [ i, commander ] of game.commanderList.entries()) {
            selectOptions.push({
                label: (i + 1).toString(),
                description: commander,
                value: (i + 1).toString()
            })
        }
        const select = new MessageSelectMenu({ customId: 'hit-options', placeholder: 'Select the commander that delt damage', options: selectOptions })
        const row1 = new MessageActionRow().addComponents(select)
        interaction.editReply({ content: 'Select the commander dealing damage', components: [ row1 ] })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: CollectorFilter<[any]> = b => b.user.id === interaction.member.user.id && b.customId.startsWith(interaction.commandName)
        const collector = <InteractionCollector<SelectMenuInteraction>> interaction.channel.createMessageComponentCollector({ filter: filter, time: 60000 })
        collector.once('collect', async c => {
            c.update({ embeds: [ game.changeCommanderDamage(interaction.options.getUser('player').id, c.values[0], interaction.options.getInteger('amount')) ] })
        })
        collector.once('end', () => { interaction.editReply({ content: 'Commander selection failed (commander damage not applied)', components: [] }) })
        return
    }
    return { embeds: [ standings ] }
}

module.exports = { data: data, execute: hit, gameCommand: true }