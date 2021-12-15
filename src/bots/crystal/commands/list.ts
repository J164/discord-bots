import { ApplicationCommandData, ButtonInteraction, CollectorFilter, CommandInteraction, InteractionCollector, InteractionUpdateOptions, MessageEmbedOptions } from 'discord.js'
import { readFileSync } from 'fs'
import { generateEmbed } from '../../../core/utils/generators.js'
import { Command, GuildInfo } from '../../../core/utils/interfaces.js'

const data: ApplicationCommandData = {
    name: 'list',
    description: 'List all of the Naruto songs'
}

function songEmbed(songs: string[], i: number): MessageEmbedOptions {
    const embed = generateEmbed('info', {
        title: 'Naruto Songs',
        footer: { text: `${i + 1}/${Math.ceil(songs.length / 25)}` },
        fields: []
    })
    for (let r = 0 + (i * 25); r < 25 + (i * 25); r++) {
        if (r >= songs.length) {
            break
        }
        embed.fields.push({ name: `${r + 1}:`, value: songs[r] })
    }
    return embed
}

async function list(interaction: CommandInteraction, info: GuildInfo, i = 0, button: ButtonInteraction = null,): Promise<void> {
    const songs = JSON.parse(readFileSync('./assets/data/naruto.json', { encoding: 'utf8' }))
    const replyOptions: InteractionUpdateOptions = { embeds: [ songEmbed(songs.songs, i) ], components: [ { components: [
        { type: 'BUTTON', customId: 'list-doublearrowleft', emoji: '\u23EA', label: 'Return to Beginning', style: 'SECONDARY', disabled: i === 0 },
        { type: 'BUTTON', customId: 'list-arrowleft', emoji: '\u2B05\uFE0F', label: 'Previous Page', style: 'SECONDARY', disabled: i === 0 },
        { type: 'BUTTON', customId: 'list-arrowright', emoji: '\u27A1\uFE0F', label: 'Next Page', style: 'SECONDARY', disabled: i === (Math.ceil(songs.songs.length / 25) - 1) },
        { type: 'BUTTON', customId: 'list-doublearrowright', emoji: '\u23E9', label: 'Jump to End', style: 'SECONDARY', disabled: i === (Math.ceil(songs.songs.length / 25) - 1) }
    ], type: 'ACTION_ROW' } ] }
    if (button) {
        button.update(replyOptions)
    } else {
        interaction.editReply(replyOptions)
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

export const command: Command = { data: data, execute: list }