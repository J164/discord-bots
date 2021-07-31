import { ApplicationCommandData, CommandInteraction, MessageReaction } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { clearReactions, genericEmbedResponse } from '../../../core/commonFunctions'
import { PotatoGuildInputManager } from '../PotatoGuildInputManager'
import { QueueItem } from '../PotatoVoiceManager'

const data: ApplicationCommandData = {
    name: 'queue',
    description: 'Get the song queue'
}

async function queue(interaction: CommandInteraction, info: PotatoGuildInputManager, queueArray: QueueItem[][] = null, i = 0): Promise<void> {
    if (!queueArray) {
        queueArray = info.voiceManager.getQueue()
        if (!queueArray) {
            interaction.editReply({ content: 'There is no queue!' })
            return
        }
    }
    let title = 'Queue'
    if (info.voiceManager.getQueueLoop()) {
        title += ' (Looping)'
    }
    const queueMessage = genericEmbedResponse(title).setFooter(`${i + 1}/${queueArray.length}`)
    for (const [ index, entry ] of queueArray[i].entries()) {
        queueMessage.addField(`${index + 1}.`, `${entry.title}\n${entry.webpageUrl}`)
    }
    const rawMenu = await interaction.editReply({ embeds: [ queueMessage ] })
    const menu = await interaction.channel.messages.fetch(rawMenu.id)
    const emojiList = [ '\u274C' ]
    if (i !== 0) {
        emojiList.unshift('\u2B05\uFE0F')
        emojiList.unshift('\u23EA')
    }
    if (i !== queueArray.length - 1) {
        emojiList.push('\u27A1\uFE0F')
        emojiList.push('\u23E9')
    }
    const reactions: MessageReaction[] = []
    for (const emoji of emojiList) {
        reactions.push(await menu.react(emoji))
    }
    function filter(reaction: MessageReaction): boolean { return reaction.client === interaction.client }
    const reactionCollection = await menu.awaitReactions({ filter, max: 1, time: 60000})
    const reactionResult = reactionCollection.first()
    if (!reactionResult) {
        clearReactions(reactions)
        return
    }
    switch (reactionResult.emoji.name) {
        case '\u2B05\uFE0F':
            await clearReactions(reactions)
            queue(interaction, info, queueArray, i - 1)
            break
        case '\u23EA':
            await clearReactions(reactions)
            queue(interaction, info, queueArray)
            break
        case '\u27A1\uFE0F':
            await clearReactions(reactions)
            queue(interaction, info, queueArray, i + 1)
            break
        case '\u23E9':
            await clearReactions(reactions)
            queue(interaction, info, queueArray, queueArray.length - 1)
            break
        default:
            menu.delete()
            break
    }
}

module.exports = new BaseCommand(data, queue)