import { MessageEmbedOptions } from 'discord.js'

export function generateEmbed(type: 'info' | 'error' | 'success' | 'prompt', options: MessageEmbedOptions): MessageEmbedOptions {
    switch (type) {
        case 'info':
            options.color ??= 0x00_99_FF
            options.title = `\uD83D\uDCC4\t${options.title}`
            break
        case 'error':
            options.color ??= 0xFF_00_00
            options.title = `\u274C\t${options.title}`
            break
        case 'success':
            options.color ??= 0x00_FF_00
            options.title = `\u2705\t${options.title}`
            break
        case 'prompt':
            options.color ??= 0xFF_A5_00
            options.title = `\u2753\t${options.title}`
            break
    }
    return options
}