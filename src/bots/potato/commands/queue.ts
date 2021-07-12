import { Message, MessageReaction } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { genericEmbedResponse } from '../../../core/common'
import { PotatoGuildInputManager } from '../PotatoGuildInputManager'
import { QueueItem } from '../PotatoVoiceManager'

async function queue(message: Message, info: PotatoGuildInputManager, queueArray: QueueItem[][] = null, index = 0): Promise<void> {
    if (!queueArray) {
        queueArray = info.voiceManager.getQueue()
        if (!queueArray) {
            message.reply('There is no queue!')
            return
        }
    }
    const queueMessage = genericEmbedResponse('Queue')
    for (const [ i, entry ] of queueArray[index].entries()) {
        queueMessage.addField(`${i + 1}.`, `${entry.title}\n${entry.webpageUrl}`)
    }
    if (info.voiceManager.getQueueLoop()) {
        queueMessage.setFooter('Looping', 'https://www.clipartmax.com/png/middle/353-3539119_arrow-repeat-icon-cycle-loop.png')
    }
    const menu = await message.channel.send(queueMessage)
    const emojiList = [ '\u274C' ]
    if (index > 0) {
        emojiList.unshift('\u2B05\uFE0F')
    }
    if (index < queueArray.length - 1) {
        emojiList.push('\u27A1\uFE0F')
    }
    for (const emoji of emojiList) {
        await menu.react(emoji)
    }
    function filter(reaction: MessageReaction): boolean { return reaction.client === message.client }
    const reactionCollection = await menu.awaitReactions(filter, { max: 1 })
    const reactionResult = reactionCollection.first()
    switch (reactionResult.emoji.name) {
        case '\u2B05\uFE0F':
            await menu.delete()
            queue(message, info, queueArray, index - 1)
            break
        case '\u27A1\uFE0F':
            await menu.delete()
            queue(message, info, queueArray, index + 1)
            break
        default:
            menu.delete()
            break
    }
}

module.exports = new BaseCommand([ 'queue' ], queue)