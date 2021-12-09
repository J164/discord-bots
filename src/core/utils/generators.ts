import { MessageEmbed, MessageEmbedOptions } from 'discord.js'

export function generateEmbed(type: 'info' | 'error' | 'success' | 'prompt', options: MessageEmbedOptions): MessageEmbed {
    switch (type) {
        case 'info':
            options.color ??= 0x0099ff
            options.title = `\uD83D\uDCC4\t${options.title}`
            break
        case 'error':
            options.color ??= 0xff0000
            options.title = `\u274C\t${options.title}`
            break
        case 'success':
            options.color ??= 0x00ff00
            options.title = `\u2705\t${options.title}`
            break
        case 'prompt':
            options.color ??= 0xffa500
            options.title = `\u2753\t${options.title}`
            break
    }
    return new MessageEmbed(options)
}