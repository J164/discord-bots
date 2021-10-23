import { ApplicationCommandData, ButtonInteraction, CollectorFilter, CommandInteraction, InteractionCollector, InteractionReplyOptions, MessageActionRow, MessageButton } from 'discord.js'
import { genericEmbed } from '../../../core/utils/commonFunctions'
import { QueueItem } from '../../../core/voice/QueueItem'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'queue',
    description: 'Get the song queue'
}

async function queue(interaction: CommandInteraction, info: GuildInfo, queueArray: QueueItem[][] = null, button: ButtonInteraction = null, i = 0): Promise<void> {
    if (!queueArray) {
        queueArray = info.queueManager.getQueue()
        if (!queueArray) {
            interaction.editReply({ content: 'There is no queue!' })
            return
        }
    }
    let title = 'Queue'
    if (info.queueManager.getQueueLoop()) {
        title += ' (Looping)'
    }
    const queueMessage = genericEmbed({
        title: title,
        footer: { text: `${i + 1}/${queueArray.length}` }
    })
    for (const [ index, entry ] of queueArray[i].entries()) {
        queueMessage.addField(`${index + 1}.`, `${entry.title}\n${entry.url}`)
    }
    const components = [ new MessageButton({ customId: 'queue-doublearrowleft', emoji: '\u23EA', label: 'Return to Beginning', style: 'SECONDARY' }),
                         new MessageButton({ customId: 'queue-arrowleft', emoji: '\u2B05\uFE0F', label: 'Previous Page', style: 'SECONDARY' }),
                         new MessageButton({ customId: 'queue-arrowright', emoji: '\u27A1\uFE0F', label: 'Next Page', style: 'SECONDARY' }),
                         new MessageButton({ customId: 'queue-doublearrowright', emoji: '\u23E9', label: 'Jump to End', style: 'SECONDARY' }) ]
    if (i === 0) {
        components[0].setDisabled(true)
        components[1].setDisabled(true)
    }
    if (i === queueArray.length - 1) {
        components[2].setDisabled(true)
        components[3].setDisabled(true)
    }
    const row1 = new MessageActionRow().addComponents(components)
    const options: InteractionReplyOptions = { embeds: [ queueMessage ], components: [ row1 ] }
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
            default:
                break
        }
    })
    collector.once('end', () => { interaction.editReply({ components: [] }) })
}

module.exports = { data: data, execute: queue }