import { Client, Intents, TextChannel } from 'discord.js'
import { InteractionManager } from './core/interaction-manager.js'
import { QueueManager } from './core/voice/queue-manager.js'
import { getDailyReport } from './core/modules/daily-report.js'
import process from 'node:process'
import { setInterval } from 'node:timers'
import { DatabaseManager } from './core/database-manager.js'

const client = new Client({ intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES ], partials: [ 'CHANNEL' ] })
const interactionManager = new InteractionManager(new DatabaseManager())
const potatoStatus = [ 'Eating a baked potato', 'Farming potatoes', 'Decorating with potatoes', 'Looking up potato recipes', 'Potato Platformer 3000' ]

client.once('ready', async () => {
    client.user.setStatus('dnd')
    await InteractionManager.deployCommands(client, 'potato')
    await interactionManager.getCommands(client, 'potato')
    client.user.setActivity(potatoStatus[Math.floor(Math.random() * potatoStatus.length)])

    let broadcasted = false
    const guild = await client.guilds.fetch(process.env.GUILD)
    const broadcastChannel = await guild.channels.fetch(process.env.CHANNEL) as TextChannel
    let date = new Date()

    setInterval(async () => {
        client.user.setActivity(potatoStatus[Math.floor(Math.random() * potatoStatus.length)])
        interactionManager.statusCheck()

        date = new Date()

        if (date.getHours() === 7 && date.getMinutes() >= 30 && date.getMinutes() <= 35 && !broadcasted) {
            broadcasted = true
            void broadcastChannel.send(await getDailyReport(date))
        } else if (date.getHours() === 8) {
            broadcasted = false
        }
    }, 60_000)

    client.user.setStatus('online')
    console.log(`\u001B[42m We have logged in as ${client.user.tag} \u001B[0m`)

    if (date.getHours() === 7 && date.getMinutes() >= 30 && date.getMinutes() <= 35) {
        broadcasted = true
        void broadcastChannel.send(await getDailyReport(date))
    }
})

client.on('interactionCreate', async interaction => {
    if (interaction.inGuild()) {
        interactionManager.addGuild(interaction.guildId, { queueManager: new QueueManager() })
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

void client.login(process.env.POTATOTOKEN)
