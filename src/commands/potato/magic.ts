import { CommandInteraction, InteractionReplyOptions, MessageEmbedOptions, SelectMenuInteraction, User } from 'discord.js'
import { MagicGame } from '../../core/modules/games/magic-game.js'
import { GuildChatCommand } from '../../core/utils/command-types/guild-chat-command.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Info } from '../../core/utils/interfaces.js'

async function play(interaction: CommandInteraction, info: Info): Promise<InteractionReplyOptions> {
    const channel = await interaction.guild.channels.fetch(interaction.channelId)
    if (!channel.isText()) {
        return { embeds: [ generateEmbed('error', { title: 'Something went wrong!' }) ] }
    }
    const playerlist: User[] = []
    for (let index = 1; index <= 4; index++) {
        if (interaction.options.getUser(`player${index}`)) {
            playerlist.push(interaction.options.getUser(`player${index}`))
        } else {
            break
        }
    }
    const thread = await channel.threads.create({ name: interaction.options.getString('name') ?? 'Magic', autoArchiveDuration: 60 })
    info.games.set(thread.id, new MagicGame(playerlist, thread, interaction.options.getNumber('life') ?? 20))
    await thread.send({ embeds: [ (<MagicGame> info.games.get(thread.id)).printStandings() ] })
    return { embeds: [ generateEmbed('success', { title: 'Success!' }) ] }
}

async function damage(interaction: CommandInteraction, info: Info): Promise<InteractionReplyOptions> {
    const game = <MagicGame> info.games.get(interaction.channelId)
    if (!game.userInGame(interaction.options.getUser('player').id)) {
        return { embeds: [ generateEmbed('error', { title: 'That user is not part of this game!' }) ] }
    }
    let stats: MessageEmbedOptions
    stats = game.changeLife(interaction.options.getUser('player').id, interaction.options.getInteger('amount') * -1)
    if (interaction.options.getBoolean('posion') && !game.over) {
        stats = game.changePoison(interaction.options.getUser('player').id, interaction.options.getInteger('amount'))
    }
    if (interaction.options.getBoolean('commander') && !game.over) {
        const selectOptions: { label: string, description: string, value: string }[] = []
        for (const [ id, player ] of game.playerData) {
            selectOptions.push({
                label: player.name,
                description: player.name,
                value: id,
            })
        }
        await interaction.editReply({ embeds: [ generateEmbed('prompt', { title: 'Select the player dealing damage' }) ], components: [ { components: [ { type: 'SELECT_MENU', customId: 'magic-options', placeholder: 'Select the player that delt damage', options: selectOptions } ], type: 'ACTION_ROW' } ] })
        const filter = (b: SelectMenuInteraction<'cached'>) => b.user.id === interaction.user.id && b.customId.startsWith(interaction.commandName)
        const collector = interaction.channel.createMessageComponentCollector({ filter: filter, time: 60_000 })
        collector.once('collect', c => {
            if (!c.isSelectMenu()) return
            void c.update({ embeds: [ game.commanderDamage(interaction.options.getUser('player').id, interaction.options.getInteger('amount'), c.values[0]) ], components: [] })
        })
        collector.once('end', () => { try { void interaction.editReply({ components: [] }) } catch { /* thread deleted */ } })
        return
    }
    return { embeds: [ stats ] }
}

function eliminate(interaction: CommandInteraction, info: Info): InteractionReplyOptions {
    const game = <MagicGame> info.games.get(interaction.channelId)
    if (!game.userInGame(interaction.options.getUser('player').id)) {
        return { embeds: [ generateEmbed('error', { title: 'That user is not part of this game!' }) ] }
    }
    return { embeds: [ game.eliminate(interaction.options.getUser('player').id) ] }
}

function end(interaction: CommandInteraction, info: Info): InteractionReplyOptions {
    return { embeds: [ (<MagicGame> info.games.get(interaction.channelId)).finishGame() ] }
}

function standings(interaction: CommandInteraction, info: Info): InteractionReplyOptions {
    const game = <MagicGame> info.games.get(interaction.channelId)
    return { embeds: [ game.printStandings() ] }
}

async function magic(interaction: CommandInteraction, info: Info): Promise<InteractionReplyOptions> {
    switch(interaction.options.getSubcommand()) {
        case 'play':
            return play(interaction, info)
            break
        case 'damage':
            return damage(interaction, info)
            break
        case 'eliminate':
            return eliminate(interaction, info)
            break
        case 'end':
            return end(interaction, info)
            break
        case 'standings':
            return standings(interaction, info)
            break
    }
}

export const command = new GuildChatCommand({
    name: 'magic',
    description: 'Commands to interact with a Magic game',
    options: [
        {
            name: 'magic',
            description: 'Start a game of Magic: The Gathering',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'player1',
                    description: 'Player 1',
                    type: 'USER',
                    required: true,
                },
                {
                    name: 'player2',
                    description: 'Player 2',
                    type: 'USER',
                    required: true,
                },
                {
                    name: 'player3',
                    description: 'Player 3',
                    type: 'USER',
                    required: false,
                },
                {
                    name: 'player4',
                    description: 'Player 4',
                    type: 'USER',
                    required: false,
                },
                {
                    name: 'life',
                    description: 'Starting life total',
                    type: 'NUMBER',
                    minValue: 1,
                    required: false,
                },
                {
                    name: 'name',
                    description: 'Name of the game',
                    type: 'STRING',
                    required: false,
                },
            ],
        },
        {
            name: 'standings',
            description: 'Display the standings for the current Magic game',
            type: 'SUB_COMMAND',
        },
        {
            name: 'end',
            description: 'End the current Magic game',
            type: 'SUB_COMMAND',
        },
        {
            name: 'eliminate',
            description: 'Eliminate a player',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'player',
                    description: 'The player to eliminate',
                    type: 'USER',
                    required: true,
                },
            ],
        },
        {
            name: 'damage',
            description: 'Deal an amount of damage to a player or heal them',
            type: 'SUB_COMMAND',
            options: [
                {
                    name: 'player',
                    description: 'The player to damage',
                    type: 'USER',
                    required: true,
                },
                {
                    name: 'amount',
                    description: 'The amount of damage to deal (negative numbers heal)',
                    type: 'INTEGER',
                    required: true,
                },
                {
                    name: 'poison',
                    description: 'If the damage should result in poison counters being added',
                    type: 'BOOLEAN',
                    required: false,
                },
                {
                    name: 'commander',
                    description: 'If the damage is being delt by a commander',
                    type: 'BOOLEAN',
                    required: false,
                },
            ],
        },
    ],
}, { respond: magic, gameCommand: 'MAGICGAME' })