import { Intents } from 'discord.js'
import { BotClient } from './core/bot-client.js'
import process from 'node:process'

void new BotClient(
    {
        intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ],
        partials: [ 'CHANNEL' ],
        presence: {
            status: 'dnd',
            activities: [ { name: process.env.YEETSTATUS, type: 'PLAYING' } ],
        },
    },
    {
        name: 'yeet',
        guildOptions: {},
    },
).on('messageCreate', message => {
    if (!message.guild || message.author.bot) {
        return
    }

    const input = message.content.toLowerCase()
    if (/(\W|^)yee+t(\W|$)/.test(input)) {
        // todo yeetstreaks
        if (input.slice(input.indexOf('yee') + 1, input.indexOf('yee') + 11) === 'eeeeeeeeee') {
            void message.reply('Wow! Much Yeet!')
            return
        }
        void message.reply('YEEEEEEEEEET!')
    }
}).login(process.env.YEETTOKEN)
