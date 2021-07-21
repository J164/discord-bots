import { Message, MessageReaction } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { genericEmbedResponse } from '../../../core/common'
import { PotatoGuildInputManager } from '../PotatoGuildInputManager'
import { QueueItem } from '../PotatoVoiceManager'

async function queue(message: Message, info: PotatoGuildInputManager, queueArray: QueueItem[][] = null, i = 0): Promise<void> {
    if (!queueArray) {
        queueArray = info.voiceManager.getQueue()
        if (!queueArray) {
            message.reply('There is no queue!')
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
    const menu = await message.channel.send(queueMessage)
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
    function filter(reaction: MessageReaction): boolean { return reaction.client === message.client }
    const reactionCollection = await menu.awaitReactions(filter, { max: 1, time: 60000})
    const reactionResult = reactionCollection.first()
    if (!reactionResult) {
        for (const reaction of reactions) {
            reaction.remove()
        }
        return
    }
    switch (reactionResult.emoji.name) {
        case '\u2B05\uFE0F':
            await menu.delete()
            queue(message, info, queueArray, i - 1)
            break
        case '\u23EA':
            await menu.delete()
            queue(message, info, queueArray)
            break
        case '\u27A1\uFE0F':
            await menu.delete()
            queue(message, info, queueArray, i + 1)
            break
        case '\u23E9':
            await menu.delete()
            queue(message, info, queueArray, queueArray.length - 1)
            break
        default:
            menu.delete()
            break
    }
}

module.exports = new BaseCommand([ 'queue' ], queue)