import { Client, Intents } from 'discord.js'
import { writeFileSync } from 'fs'
import { deployCommands, getCommands } from '../../core/utils/commonFunctions'
import { DatabaseManager } from '../../core/DatabaseManager'
import { GuildInputManager } from '../../core/GuildInputManager'
import { Command } from '../../core/utils/interfaces'

process.on('unhandledRejection', (error: Error) => {
    if (error.name === 'FetchError') {
        process.exit()
    }
    if (error.message !== 'Unknown interaction') {
        const date = new Date()
        writeFileSync(`${process.env.data}/logs/${date.getUTCMonth()}-${date.getUTCDate()}-${date.getUTCHours()}-${date.getUTCMinutes()}-${date.getUTCSeconds()}-krenko.txt`, `${error.name}\n${error.message}\n${error.stack}`)
        process.exit()
    }
})

const client = new Client({ intents: [ Intents.FLAGS.GUILDS ] })
let commands: Map<string, Command>
const database = new DatabaseManager()
const guildStatus = new Map<string, GuildInputManager>()
const krenkoStatus = [ 'Shuffling cards', 'Building decks', 'Magic: The Gathering', 'Searching for new deck ideas' ]

client.on('ready', async () => {
    commands = await getCommands(client, 'krenko')

    client.user.setActivity(krenkoStatus[Math.floor(Math.random() * krenkoStatus.length)])

    setInterval(async () => {
        client.user.setActivity(krenkoStatus[Math.floor(Math.random() * krenkoStatus.length)])
    }, 60000)

    console.log('\x1b[42m', `We have logged in as ${client.user.tag}`, '\x1b[0m')
    process.send('start')
})

client.on('interactionCreate', async interaction => {
    if (!guildStatus.has(interaction.guildId)) {
        guildStatus.set(interaction.guildId, new GuildInputManager(commands, { database: database }))
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

process.on('message', function (arg) {
    switch (arg) {
        case 'stop':
            client.destroy()
            console.log('\x1b[41m', `${client.user.tag} has been logged out`, '\x1b[0m')
            process.send('stop')
            process.exit()
            break
        case 'start':
            client.login(process.env.krenkoKey)
            break
        case 'deploy':
            deployCommands(client, 'krenko')
            break
    }
})

process.send('ready')