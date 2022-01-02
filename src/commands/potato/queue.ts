import { ApplicationCommandData, ButtonInteraction, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { Command, GuildInfo } from '../../core/utils/interfaces.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { QueueItem } from '../../core/voice/queue-manager.js'

const data: ApplicationCommandData = {
    name: 'queue',
    description: 'Get the song queue'
}

async function queue(interaction: CommandInteraction, info: GuildInfo, queueArray?: QueueItem[][], button?: ButtonInteraction, page = 0): Promise<void> {
    if (!queueArray) {
        queueArray = await info.queueManager.getQueue()
        if (!queueArray) {
            interaction.editReply({ embeds: [ generateEmbed('error', { title: 'There is no queue!' }) ] })
            return
        }
    }
    let title = 'Queue'
    if (info.queueManager.getQueueLoop()) {
        title += ' (Looping)'
    }
    const queueMessage = generateEmbed('info', {
        title: title,
        footer: { text: `${page + 1}/${queueArray.length}` },
        fields: []
    })
    for (const [ index, entry ] of queueArray[page].entries()) {
        const hour = Math.floor(entry.duration / 3600)
        const min = Math.floor((entry.duration % 3600) / 60)
        const sec = (entry.duration % 60)
        queueMessage.fields.push({ name: index === 0 && page === 0 ? 'Currently Playing:' : `${index + (page * 25)}.`, value: `${entry.title} (${hour < 10 ? `0${hour}` : hour}:${min < 10 ? `0${min}` : min}:${sec < 10 ? `0${sec}` : sec})\n${entry.url}` })
    }
    const options: InteractionReplyOptions = { embeds: [ queueMessage ], components: [ { components: [
        { type: 'BUTTON', customId: 'queue-doublearrowleft', emoji: '\u23EA', label: 'Return to Beginning', style: 'SECONDARY', disabled: page === 0 },
        { type: 'BUTTON', customId: 'queue-arrowleft', emoji: '\u2B05\uFE0F', label: 'Previous Page', style: 'SECONDARY', disabled: page === 0 },
        { type: 'BUTTON', customId: 'queue-arrowright', emoji: '\u27A1\uFE0F', label: 'Next Page', style: 'SECONDARY', disabled: page === queueArray.length - 1 },
        { type: 'BUTTON', customId: 'queue-doublearrowright', emoji: '\u23E9', label: 'Jump to End', style: 'SECONDARY', disabled: page === queueArray.length - 1 }
    ], type: 'ACTION_ROW' } ] }
    await (!button ? interaction.editReply(options) : button.update(options))
    const filter = (b: ButtonInteraction<'cached'>) => b.user.id === interaction.member.user.id && b.customId.startsWith(interaction.commandName)
    const collector = interaction.channel.createMessageComponentCollector({ filter: filter, time: 60_000 })
    collector.once('collect', async b => {
        if (!b.isButton()) return
        switch (b.customId) {
            case 'queue-doublearrowleft':
                queue(interaction, info, queueArray, b)
                break
            case 'queue-arrowleft':
                queue(interaction, info, queueArray, b, page - 1)
                break
            case 'queue-arrowright':
                queue(interaction, info, queueArray, b, page + 1)
                break
            case 'queue-doublearrowright':
                queue(interaction, info, queueArray, b, queueArray.length - 1)
                break
        }
    })
    collector.once('end', () => { interaction.editReply({ components: [] }) })
}

export const command: Command = { data: data, execute: queue, ephemeral: true }