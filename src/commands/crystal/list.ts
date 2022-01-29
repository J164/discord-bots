import { ButtonInteraction, CommandInteraction, InteractionUpdateOptions, MessageEmbedOptions } from 'discord.js'
import { readFileSync } from 'node:fs'
import { ChatCommand } from '../../core/utils/command-types/chat-command.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { BotInfo } from '../../core/utils/interfaces.js'

function songEmbed(songs: string[], index: number): MessageEmbedOptions {
    const embed = generateEmbed('info', {
        title: 'Naruto Songs',
        footer: { text: `${index + 1}/${Math.ceil(songs.length / 25)}` },
        fields: [],
    })
    for (let r = 0 + (index * 25); r < 25 + (index * 25); r++) {
        if (r >= songs.length) {
            break
        }
        embed.fields.push({ name: `${r + 1}:`, value: songs[r] })
    }
    return embed
}

async function list(interaction: CommandInteraction, info: BotInfo, index = 0, button?: ButtonInteraction): Promise<void> {
    const songs = JSON.parse(readFileSync('./assets/data/naruto.json', { encoding: 'utf8' })) as { songs: string[] }
    const replyOptions: InteractionUpdateOptions = { embeds: [ songEmbed(songs.songs, index) ], components: [ { components: [
        { type: 'BUTTON', customId: 'list-doublearrowleft', emoji: '\u23EA', label: 'Return to Beginning', style: 'SECONDARY', disabled: index === 0 },
        { type: 'BUTTON', customId: 'list-arrowleft', emoji: '\u2B05\uFE0F', label: 'Previous Page', style: 'SECONDARY', disabled: index === 0 },
        { type: 'BUTTON', customId: 'list-arrowright', emoji: '\u27A1\uFE0F', label: 'Next Page', style: 'SECONDARY', disabled: index === (Math.ceil(songs.songs.length / 25) - 1) },
        { type: 'BUTTON', customId: 'list-doublearrowright', emoji: '\u23E9', label: 'Jump to End', style: 'SECONDARY', disabled: index === (Math.ceil(songs.songs.length / 25) - 1) },
    ], type: 'ACTION_ROW' } ] }
    await (button ? button.update(replyOptions) : interaction.editReply(replyOptions))
    const filter = (b: ButtonInteraction<'cached'>) => b.user.id === interaction.user.id && b.customId.startsWith(interaction.commandName)
    const collector = interaction.channel.createMessageComponentCollector({ filter: filter, time: 60_000 })
    collector.once('collect', b => {
        if (!b.isButton()) return
        switch (b.customId) {
            case 'list-doublearrowleft':
                void list(interaction, info, 0, b)
                break
            case 'list-arrowleft':
                void list(interaction, info, index - 1, b)
                break
            case 'list-arrowright':
                void list(interaction, info, index + 1, b)
                break
            case 'list-doublearrowright':
                void list(interaction, info, songs.songs.length - 1, b)
                break
        }
    })
    collector.once('end', () => { try { void interaction.editReply({ components: [] }) } catch { /* thread deleted */ } })
}

export const command = new ChatCommand({
    name: 'list',
    description: 'List all of the Naruto songs',
}, { respond: list, ephemeral: true })