import { Client, Intents } from 'discord.js'
import { InteractionManager } from '../core/interaction-manager.js'
import process from 'node:process'
import { setInterval } from 'node:timers'
import { VoiceManager } from '../core/voice/voice-manager.js'

const client = new Client({ intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ], partials: [ 'CHANNEL' ] })
const interactionManager = new InteractionManager()
//const yeetStreaks = new Map<Snowflake, { number: number, time: number }>()
const yeetStatus = [ 'Yeeting the Child', 'YA YEEEEEEEEEET', 'Yeeting People off Cliffs', 'Yeeting Washing Machines' ]

client.once('ready', async () => {
    client.user.setStatus('dnd')
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

    client.user.setStatus('online')
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
    if (interaction.inGuild()) {
        interactionManager.addGuild(interaction.guildId, { voiceManager: new VoiceManager() })
    }

    if (interaction.isAutocomplete()) {
        const response = await interactionManager.autocomplete(interaction)
        try { void interaction.respond(response) } catch { /* prevent unknown interaction */ }
        return
    }

    if (!interaction.isCommand()) {
        return
    }

    const response = await interactionManager.parseChatCommand(interaction)
    if (response) {
        void interaction.editReply(response)
    }
})

void client.login(process.env.YEETTOKEN)
