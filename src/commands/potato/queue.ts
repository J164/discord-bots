import { ButtonInteraction, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { Info } from '../../core/utils/interfaces.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { QueueItem } from '../../core/voice/queue-manager.js'
import { GuildChatCommand } from '../../core/utils/command-types/guild-chat-command.js'

async function queue(interaction: CommandInteraction, info: Info, queueArray?: QueueItem[][], button?: ButtonInteraction, page = 0): Promise<void> {
    if (!queueArray) {
        queueArray = await info.queueManager.getPaginatedQueue()
        if (!queueArray) {
            void interaction.editReply({ embeds: [ generateEmbed('error', { title: 'There is no queue!' }) ] })
            return
        }
    }
    let title = 'Queue'
    if (info.queueManager.queueLoop) {
        title += ' (Looping)'
    }
    const queueMessage = generateEmbed('info', {
        title: title,
        footer: { text: `${page + 1}/${queueArray.length}` },
        fields: [],
    })
    for (const [ index, entry ] of queueArray[page].entries()) {
        queueMessage.fields.push({ name: index === 0 && page === 0 ? 'Currently Playing:' : `${index + (page * 25)}.`, value: `${entry.title} (${entry.duration})\n${entry.url}` })
    }
    const options: InteractionReplyOptions = { embeds: [ queueMessage ], components: [ { components: [
        { type: 'BUTTON', customId: 'queue-doublearrowleft', emoji: '\u23EA', label: 'Return to Beginning', style: 'SECONDARY', disabled: page === 0 },
        { type: 'BUTTON', customId: 'queue-arrowleft', emoji: '\u2B05\uFE0F', label: 'Previous Page', style: 'SECONDARY', disabled: page === 0 },
        { type: 'BUTTON', customId: 'queue-arrowright', emoji: '\u27A1\uFE0F', label: 'Next Page', style: 'SECONDARY', disabled: page === queueArray.length - 1 },
        { type: 'BUTTON', customId: 'queue-doublearrowright', emoji: '\u23E9', label: 'Jump to End', style: 'SECONDARY', disabled: page === queueArray.length - 1 },
    ], type: 'ACTION_ROW' } ] }
    await (!button ? interaction.editReply(options) : button.update(options))
    const filter = (b: ButtonInteraction<'cached'>) => b.user.id === interaction.user.id && b.customId.startsWith(interaction.commandName)
    const collector = interaction.channel.createMessageComponentCollector({ filter: filter, time: 60_000 })
    collector.once('collect', b => {
        if (!b.isButton()) return
        switch (b.customId) {
            case 'queue-doublearrowleft':
                void queue(interaction, info, queueArray, b)
                break
            case 'queue-arrowleft':
                void queue(interaction, info, queueArray, b, page - 1)
                break
            case 'queue-arrowright':
                void queue(interaction, info, queueArray, b, page + 1)
                break
            case 'queue-doublearrowright':
                void queue(interaction, info, queueArray, b, queueArray.length - 1)
                break
        }
    })
    collector.once('end', () => { try { void interaction.editReply({ components: [] }) } catch { /* thread deleted */ } })
}

export const command = new GuildChatCommand({
    name: 'queue',
    description: 'Get the song queue',
}, { respond: queue, ephemeral: true })