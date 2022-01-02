import { Client, Intents } from 'discord.js'
import { writeFileSync } from 'node:fs'
import { DatabaseManager } from '../core/database-manager.js'
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
        writeFileSync(`${process.env.DATA}/logs/${date.getUTCMonth()}-${date.getUTCDate()}-${date.getUTCHours()}-${date.getUTCMinutes()}-${date.getUTCSeconds()}-krenko.txt`, `${error.name}\n${error.message}\n${error.stack}`)
        process.exit()
    }
})

const client = new Client({ intents: [ Intents.FLAGS.GUILDS ] })
const interactionManager = new InteractionManager(new DatabaseManager())
const krenkoStatus = [ 'Shuffling cards', 'Building decks', 'Magic: The Gathering', 'Searching for new deck ideas' ]

client.once('ready', async () => {
    await InteractionManager.deployCommands(client, 'krenko')
    await interactionManager.getCommands(client, 'krenko')
    client.user.setActivity(krenkoStatus[Math.floor(Math.random() * krenkoStatus.length)])

    setInterval(() => {
        client.user.setActivity(krenkoStatus[Math.floor(Math.random() * krenkoStatus.length)])
    }, 60_000)

    console.log(`\u001B[42m We have logged in as ${client.user.tag} \u001B[0m`)
})

client.on('interactionCreate', async interaction => {
    if (!interaction.inGuild()) {
        return
    }

    interactionManager.addGuild(interaction.guildId)

    if (interaction.isAutocomplete()) {
        const response = await interactionManager.autocomplete(interaction)
        interaction.respond(response)
        return
    }

    if (!interaction.isCommand()) {
        return
    }

    const response = await interactionManager.parseCommand(interaction)
    if (response) {
        interaction.editReply(response)
    }
})

client.login(process.env.KRENKOTOKEN)