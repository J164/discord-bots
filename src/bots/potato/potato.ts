import { Client, Intents, TextChannel } from 'discord.js'
import { writeFileSync } from 'fs'
import { deployCommands, getCommands } from '../../core/utils/commonFunctions'
import { GuildInputManager } from '../../core/GuildInputManager'
import { Command } from '../../core/utils/interfaces'
import { QueueManager } from '../../core/voice/QueueManager'
import { getDailyReport } from '../../core/modules/DailyReport'

process.on('unhandledRejection', (error: Error) => {
    if (error.name === 'FetchError') {
        process.exit()
    }
    if (error.message !== 'Unknown interaction') {
        const date = new Date()
        writeFileSync(`${process.env.data}/logs/${date.getUTCMonth()}-${date.getUTCDate()}-${date.getUTCHours()}-${date.getUTCMinutes()}-${date.getUTCSeconds()}-potato.txt`, `${error.name}\n${error.message}\n${error.stack}`)
        process.exit()
    }
})

const client = new Client({ intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES ] })
let commands: Map<string, Command>
const guildStatus = new Map<string, GuildInputManager>()
const potatoStatus = [ 'Eating a baked potato', 'Farming potatoes', 'Decorating with potatoes', 'Looking up potato recipes', 'Potato Platformer 3000' ]

client.on('ready', async () => {
    commands = await getCommands(client, 'potato')

    client.user.setActivity(potatoStatus[Math.floor(Math.random() * potatoStatus.length)])

    let broadcasted = false
    const guild = await client.guilds.fetch('619975185029922817')
    const broadcastChannel = <TextChannel> await guild.channels.fetch('775752263808974858')
    let date = new Date()

    setInterval(async () => {
        client.user.setActivity(potatoStatus[Math.floor(Math.random() * potatoStatus.length)])

        for (const [ , guildManager ] of guildStatus) {
            guildManager.statusCheck()
        }

        date = new Date()

        if (date.getHours() === 7 && !broadcasted) {
            broadcasted = true
            broadcastChannel.send(await getDailyReport(date))
        } else if (date.getHours() === 8) {
            broadcasted = false
        }
    }, 60000)

    console.log('\x1b[42m', `We have logged in as ${client.user.tag}`, '\x1b[0m')
    process.send('start')

    if (date.getHours() === 7) {
        broadcastChannel.send(await getDailyReport(date))
    }
})

client.on('interactionCreate', async interaction => {
    if (!guildStatus.has(interaction.guildId)) {
        guildStatus.set(interaction.guildId, new GuildInputManager(commands, { queueManager: new QueueManager() }))
    }

    if (interaction.isAutocomplete()) {
        const response = await guildStatus.get(interaction.guildId).autocomplete(interaction)
        if (!interaction.responded) {
            interaction.respond(response)
        }
        return
    }

    if (!interaction.isCommand()) {
        return
    }

    const response = await guildStatus.get(interaction.guildId).parseCommand(interaction)
    if (response) {
        interaction.editReply(response)
    }
})

process.on('message', arg => {
    switch (arg) {
        case 'stop':
            client.destroy()
            console.log('\x1b[41m', 'Potato Bot has been logged out', '\x1b[0m')
            process.send('stop')
            process.exit()
            break
        case 'start':
            client.login(process.env.potatoKey)
            break
        case 'deploy':
            deployCommands(client, 'potato')
            break
        default:
            break
    }
})

process.send('ready')