import { ApplicationCommandData, ButtonInteraction, CollectorFilter, CommandInteraction, InteractionCollector, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js'
import { readFileSync } from 'fs'
import { generateEmbed } from '../../../core/utils/generators'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'list',
    description: 'List all of the Naruto songs'
}

function songEmbed(songs: string[], i: number): MessageEmbed {
    const embed = generateEmbed('info', {
        title: 'Naruto Songs',
        footer: { text: `${i + 1}/${Math.ceil(songs.length / 25)}` }
    })
    for (let r = 0 + (i * 25); r < 25 + (i * 25); r++) {
        if (r >= songs.length) {
            break
        }
        embed.addField(`${r + 1}:`, songs[r])
    }
    return embed
}

async function list(interaction: CommandInteraction, info: GuildInfo, i = 0, button: ButtonInteraction = null,): Promise<void> {
    const songs = JSON.parse(readFileSync('./assets/data/naruto.json', { encoding: 'utf8' }))
    const components = [ new MessageButton({ customId: 'list-doublearrowleft', emoji: '\u23EA', label: 'Return to Beginning', style: 'SECONDARY' }),
                         new MessageButton({ customId: 'list-arrowleft', emoji: '\u2B05\uFE0F', label: 'Previous Page', style: 'SECONDARY' }),
                         new MessageButton({ customId: 'list-arrowright', emoji: '\u27A1\uFE0F', label: 'Next Page', style: 'SECONDARY' }),
                         new MessageButton({ customId: 'list-doublearrowright', emoji: '\u23E9', label: 'Jump to End', style: 'SECONDARY' }) ]
    if (i === 0) {
        components[0].setDisabled(true)
        components[1].setDisabled(true)
    }
    if (i === (Math.ceil(songs.songs.length / 25) - 1)) {
        components[2].setDisabled(true)
        components[3].setDisabled(true)
    }
    const row1 = new MessageActionRow().addComponents(components)
    if (button) {
        button.update({ embeds: [ songEmbed(songs.songs, i) ], components: [ row1 ] })
    } else {
        interaction.editReply({ embeds: [ songEmbed(songs.songs, i) ], components: [ row1 ] })
    }
    const filter: CollectorFilter<[ButtonInteraction]> = b => b.user.id === interaction.member.user.id && b.customId.startsWith(interaction.commandName)
    const collector = <InteractionCollector<ButtonInteraction>> interaction.channel.createMessageComponentCollector({ filter: filter, time: 60000 })
    collector.once('collect', async b => {
        switch (b.customId) {
            case 'list-doublearrowleft':
                list(interaction, info, 0, b)
                break
            case 'list-arrowleft':
                list(interaction, info, i - 1, b)
                break
            case 'list-arrowright':
                list(interaction, info, i + 1, b)
                break
            case 'list-doublearrowright':
                list(interaction, info, songs.songs.length - 1, b)
                break
        }
    })
    collector.once('end', () => { interaction.editReply({ components: [] }) })
}

module.exports = { data: data, execute: list }