import { CommandInteraction, InteractionReplyOptions, MessageEmbedOptions, SelectMenuInteraction } from 'discord.js'
import { MagicGame } from '../../core/modules/games/magic-game.js'
import { CommanderMagicGame } from '../../core/modules/games/commander-magic-game.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'

async function hit(interaction: CommandInteraction, info: GuildInfo): Promise<InteractionReplyOptions> {
    const game = info.games.get(interaction.channelId)
    if (!game || !(game instanceof MagicGame) || game.isOver()) {
        return { embeds: [ generateEmbed('error', { title: 'There is currently no Magic game in this channel' }) ] }
    }
    if (!game.userInGame(interaction.options.getUser('player').id)) {
        return { embeds: [ generateEmbed('error', { title: 'That user is not part of this game!' }) ] }
    }
    let standings: MessageEmbedOptions
    standings = game.changeLife(interaction.options.getUser('player').id, interaction.options.getInteger('amount') * -1)
    if (interaction.options.getBoolean('posion') && !game.isOver()) {
        standings = game.changePoison(interaction.options.getUser('player').id, interaction.options.getInteger('amount'))
    }
    if (interaction.options.getBoolean('commander') && game instanceof CommanderMagicGame && !game.isOver()) {
        const selectOptions: { label: string, description: string, value: string }[] = []
        for (const [ index, commander ] of game.commanderList.entries()) {
            selectOptions.push({
                label: (index + 1).toString(),
                description: commander,
                value: (index + 1).toString()
            })
        }
        await interaction.editReply({ embeds: [ generateEmbed('prompt', { title: 'Select the commander dealing damage' }) ], components: [ { components: [ { type: 'SELECT_MENU', customId: 'hit-options', placeholder: 'Select the commander that delt damage', options: selectOptions } ], type: 'ACTION_ROW' } ] })
        const filter = (b: SelectMenuInteraction<'cached'>) => b.user.id === interaction.member.user.id && b.customId.startsWith(interaction.commandName)
        const collector = interaction.channel.createMessageComponentCollector({ filter: filter, time: 60_000 })
        collector.once('collect', c => {
            if (!c.isSelectMenu()) return
            void c.update({ embeds: [ game.changeCommanderDamage(interaction.options.getUser('player').id, c.values[0], interaction.options.getInteger('amount')) ] })
        })
        collector.once('end', () => { void interaction.editReply({ embeds: [ generateEmbed('error', { title: 'Commander selection failed (commander damage not applied)' }) ], components: [] }) })
        return
    }
    return { embeds: [ standings ] }
}

export const command: Command = { data: {
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
}, execute: hit, gameCommand: true }