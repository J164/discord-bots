import { ButtonInteraction, InteractionUpdateOptions, MessageEmbedOptions } from 'discord.js'
import { readFileSync } from 'node:fs'
import { generateEmbed } from '../../core/utils/generators.js'
import { GlobalChatCommand, GlobalChatCommandInfo } from '../../core/utils/interfaces.js'

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

async function list(info: GlobalChatCommandInfo, index = 0, button?: ButtonInteraction): Promise<undefined> {
    const songs = JSON.parse(readFileSync('./assets/data/naruto.json', { encoding: 'utf8' })) as { songs: string[] }
    const replyOptions: InteractionUpdateOptions = { embeds: [ songEmbed(songs.songs, index) ], components: [ { components: [
        { type: 'BUTTON', customId: 'list-doublearrowleft', emoji: '\u23EA', label: 'Return to Beginning', style: 'SECONDARY', disabled: index === 0 },
        { type: 'BUTTON', customId: 'list-arrowleft', emoji: '\u2B05\uFE0F', label: 'Previous Page', style: 'SECONDARY', disabled: index === 0 },
        { type: 'BUTTON', customId: 'list-arrowright', emoji: '\u27A1\uFE0F', label: 'Next Page', style: 'SECONDARY', disabled: index === (Math.ceil(songs.songs.length / 25) - 1) },
        { type: 'BUTTON', customId: 'list-doublearrowright', emoji: '\u23E9', label: 'Jump to End', style: 'SECONDARY', disabled: index === (Math.ceil(songs.songs.length / 25) - 1) },
    ], type: 'ACTION_ROW' } ] }
    await (button ? button.update(replyOptions) : info.interaction.editReply(replyOptions))
    info.interaction.channel.createMessageComponentCollector({ filter: b => b.user.id === info.interaction.user.id && b.customId.startsWith(info.interaction.commandName), time: 300_000, componentType: 'BUTTON', max: 1 })
        .once('end', async b => {
            await info.interaction.editReply({ components: [] }).catch()
            if (!b.at(0)) return
            switch (b.at(0).customId) {
                case 'list-doublearrowleft':
                    void list(info, 0, b.at(0))
                    break
                case 'list-arrowleft':
                    void list(info, index - 1, b.at(0))
                    break
                case 'list-arrowright':
                    void list(info, index + 1, b.at(0))
                    break
                case 'list-doublearrowright':
                    void list(info, songs.songs.length - 1, b.at(0))
                    break
            }
        })
    return undefined
}

export const command = new GlobalChatCommand({
    name: 'list',
    description: 'List all of the Naruto songs',
}, { respond: list, ephemeral: true })