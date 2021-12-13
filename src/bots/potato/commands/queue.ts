import { ApplicationCommandData, ButtonInteraction, CollectorFilter, CommandInteraction, InteractionCollector, InteractionReplyOptions } from 'discord.js'
import { GuildInfo } from '../../../core/utils/interfaces'
import { generateEmbed } from '../../../core/utils/generators'
import { QueueItem } from '../../../core/voice/QueueManager'

const data: ApplicationCommandData = {
    name: 'queue',
    description: 'Get the song queue'
}

async function queue(interaction: CommandInteraction, info: GuildInfo, queueArray: QueueItem[][] = null, button: ButtonInteraction = null, i = 0): Promise<void> {
    if (!queueArray) {
        queueArray = await info.queueManager.getQueue()
        if (!queueArray) {
            interaction.editReply({ content: 'There is no queue!' })
            return
        }
    }
    let title = 'Queue'
    if (info.queueManager.getQueueLoop()) {
        title += ' (Looping)'
    }
    const queueMessage = generateEmbed('info', {
        title: title,
        footer: { text: `${i + 1}/${queueArray.length}` },
        fields: []
    })
    for (const [ index, entry ] of queueArray[i].entries()) {
        const hour = Math.floor(entry.duration / 3600)
        const min = Math.floor((entry.duration % 3600) / 60)
        const sec = (entry.duration % 60)
        queueMessage.fields.push({ name: index === 0 ? 'Currently Playing:' : `${index}.`, value: `${entry.title} (${hour < 10 ? `0${hour}` : hour}:${min < 10 ? `0${min}` : min}:${sec < 10 ? `0${sec}` : sec})\n${entry.url}` })
    }
    const options: InteractionReplyOptions = { embeds: [ queueMessage ], components: [ { components: [
        { type: 'BUTTON', customId: 'queue-doublearrowleft', emoji: '\u23EA', label: 'Return to Beginning', style: 'SECONDARY', disabled: i === 0 },
        { type: 'BUTTON', customId: 'queue-arrowleft', emoji: '\u2B05\uFE0F', label: 'Previous Page', style: 'SECONDARY', disabled: i === 0 },
        { type: 'BUTTON', customId: 'queue-arrowright', emoji: '\u27A1\uFE0F', label: 'Next Page', style: 'SECONDARY', disabled: i === queueArray.length - 1 },
        { type: 'BUTTON', customId: 'queue-doublearrowright', emoji: '\u23E9', label: 'Jump to End', style: 'SECONDARY', disabled: i === queueArray.length - 1 }
    ], type: 'ACTION_ROW' } ] }
    if (!button) {
        await interaction.editReply(options)
    } else {
        await button.update(options)
    }
    const filter: CollectorFilter<[ButtonInteraction]> = b => b.user.id === interaction.member.user.id && b.customId.startsWith(interaction.commandName)
    const collector = <InteractionCollector<ButtonInteraction>> interaction.channel.createMessageComponentCollector({ filter: filter, time: 60000 })
    collector.once('collect', async b => {
        switch (b.customId) {
            case 'queue-doublearrowleft':
                queue(interaction, info, queueArray, b)
                break
            case 'queue-arrowleft':
                queue(interaction, info, queueArray, b, i - 1)
                break
            case 'queue-arrowright':
                queue(interaction, info, queueArray, b, i + 1)
                break
            case 'queue-doublearrowright':
                queue(interaction, info, queueArray, b, queueArray.length - 1)
                break
        }
    })
    collector.once('end', () => { interaction.editReply({ components: [] }) })
}

module.exports = { data: data, execute: queue }