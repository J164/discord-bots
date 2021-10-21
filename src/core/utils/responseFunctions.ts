import { Message } from 'discord.js'
import { config } from './constants'

export function potatoMessageParse(message: Message): void {
    if (!message.guild || message.author.bot) {
        return
    }

    let mentionPotato = false
    let mentionSwear = false
    let mentionInsult = false
    const input = message.content.toLowerCase()
    if (input.match(/(\W|^)potato(s|es)?(\W|$)/)) {
        mentionPotato = true
    }
    for (const swear of config.blacklist.swears) {
        if (input.match(new RegExp(`(\\W|^)${swear}(\\W|$)`))) {
            mentionSwear = true
            break
        }
    }
    for (const insult of config.blacklist.insults) {
        if (input.match(new RegExp(`(\\W|^)${insult}(\\W|$)`))) {
            mentionInsult = true
            break
        }
    }
    if (mentionPotato && (mentionSwear || mentionInsult)) {
        message.reply('FOOL! HOW DARE YOU BLASPHEMISE THE HOLY ORDER OF THE POTATOES! EAT POTATOES!')
        message.client.user.setActivity(`Teaching ${message.author.tag} the value of potatoes`, {
            type: 'STREAMING',
            url: 'https://www.youtube.com/watch?v=fLNWeEen35Y'
        })
        return
    }
    if (mentionSwear) {
        for (let i = 0; i < 3; i++) {
            message.channel.send('a')
        }
    }
}

export function swearMessageParse(message: Message): void {
    if (!message.guild || message.author.bot) {
        return
    }

    const input = message.content.toLowerCase()
    if (input.match(/(\W|^)swear(\W|$)/)) {
        message.reply(config.blacklist.swears[Math.floor(Math.random() * config.blacklist.swears.length)])
        return
    }
    for (const swear of config.blacklist.swears) {
        if (input.match(new RegExp(`(\\W|^)${swear}(\\W|$)`))) {
            message.reply('Good job swearing! Hell yeah!')
            return
        }
    }
}

export function yeetMessageParse(message: Message): void {
    if (!message.guild || message.author.bot) {
        return
    }

    const input = message.content.toLowerCase()
    if (input.match(/(\W|^)yee+t(\W|$)/)) {
        if (input.substr(input.indexOf('yee') + 1, 10) === 'eeeeeeeeee') {
            message.reply('Wow! Much Yeet!')
            return
        }
        message.reply('YEEEEEEEEEET!')
    }
}