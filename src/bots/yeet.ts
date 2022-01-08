import { Client, Intents } from 'discord.js'
import { writeFileSync } from 'node:fs'
import { InteractionManager } from '../core/interaction-manager.js'
import process from 'node:process'
import { setInterval } from 'node:timers'
import { config } from 'dotenv'

config()

process.on('unhandledRejection', (error: Error) => {
    if (error.name === 'FetchError') {
        process.exit()
    }
    if (error.message !== 'Unknown interaction') {
        const date = new Date()
        writeFileSync(`${process.env.DATA}/logs/${date.getUTCMonth()}-${date.getUTCDate()}-${date.getUTCHours()}-${date.getUTCMinutes()}-${date.getUTCSeconds()}-yeet.txt`, `${error.name}\n${error.message}\n${error.stack}`)
        process.exit()
    }
})

const client = new Client({ intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ] })
const interactionManager = new InteractionManager()
//const yeetStreaks = new Map<Snowflake, { number: number, time: number }>()
const yeetStatus = [ 'Yeeting the Child', 'YA YEEEEEEEEEET', 'Yeeting People off Cliffs', 'Yeeting Washing Machines' ]

client.once('ready', async () => {
    await InteractionManager.deployCommands(client, 'yeet')
    await interactionManager.getCommands(client, 'yeet')
    client.user.setActivity(yeetStatus[Math.floor(Math.random() * yeetStatus.length)])

    setInterval(() => {
        /*const date = new Date()
        for (const [ id, data ] of yeetStreaks) {
            if (date.getTime() - data.time > 30000) {
                yeetStreaks.delete(id)
            }
        }*/
        client.user.setActivity(yeetStatus[Math.floor(Math.random() * yeetStatus.length)])
    }, 60_000)

    console.log(`\u001B[42m We have logged in as ${client.user.tag} \u001B[0m`)
})

client.on('messageCreate', message => {
    if (!message.guild || message.author.bot) {
        return
    }

    const input = message.content.toLowerCase()
    if (/(\W|^)yee+t(\W|$)/.test(input)) {
        // todo yeetstreaks
        /*const date = new Date()
        let streak: number
        if (!yeetStreaks.has(message.author.id)) {
            streak = 1
        } else {
            streak = yeetStreaks.get(message.author.id).number + 1
        }
        yeetStreaks.set(message.author.id, { number: streak, time: date.getTime() })
        if (streak > )*/
        if (input.slice(input.indexOf('yee') + 1, input.indexOf('yee') + 11) === 'eeeeeeeeee') {
            void message.reply('Wow! Much Yeet!')
            return
        }
        void message.reply('YEEEEEEEEEET!')
    }
})

client.on('interactionCreate', async interaction => {
    if (!interaction.inGuild()) {
        return
    }

    interactionManager.addGuild(interaction.guildId)

    if (interaction.isAutocomplete()) {
        const response = await interactionManager.autocomplete(interaction)
        void interaction.respond(response)
        return
    }

    if (!interaction.isCommand()) {
        return
    }

    const response = await interactionManager.parseCommand(interaction)
    if (response) {
        void interaction.editReply(response)
    }
})

void client.login(process.env.YEETTOKEN)