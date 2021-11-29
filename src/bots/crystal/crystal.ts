import { Client, Intents } from 'discord.js'
import { writeFileSync } from 'fs'
import { GuildInputManager } from '../../core/GuildInputManager'
import { deployCommands, getCommands } from '../../core/utils/commonFunctions'
import { Command } from '../../core/utils/interfaces'
import { VoiceManager } from '../../core/voice/VoiceManager'

process.on('unhandledRejection', (error: Error) => {
    if (error.name === 'FetchError') {
        process.exit()
    }
    if (error.message !== 'Unknown interaction') {
        const date = new Date()
        writeFileSync(`${process.env.data}/logs/${date.getUTCMonth()}-${date.getUTCDate()}-${date.getUTCHours()}-${date.getUTCMinutes()}-${date.getUTCSeconds()}-crystal.txt`, `${error.name}\n${error.message}\n${error.stack}`)
        process.exit()
    }
})

const client = new Client({ intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES ] })
let commands: Map<string, Command>
const guildStatus = new Map<string, GuildInputManager>()
const crystalStatus = [ 'Karl Needs a Bandage', 'The Agent Game', 'Gangster Town', 'The Running Game', 'The Games (Which one?)' ]

client.on('ready', async () => {
    commands = await getCommands(client, 'crystal')

    client.user.setActivity(crystalStatus[Math.floor(Math.random() * crystalStatus.length)])

    setInterval(async () => {
        client.user.setActivity(crystalStatus[Math.floor(Math.random() * crystalStatus.length)])

        for (const [ , guildManager ] of guildStatus) {
            guildManager.statusCheck()
        }
    }, 60000)

    console.log('\x1b[42m', `We have logged in as ${client.user.tag}`, '\x1b[0m')
    process.send('start')
})

client.on('interactionCreate', async interaction => {
    if (!guildStatus.has(interaction.guildId)) {
        guildStatus.set(interaction.guildId, new GuildInputManager(commands, { voiceManager: new VoiceManager() }))
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
            console.log('\x1b[41m', `${client.user.tag} has been logged out`, '\x1b[0m')
            process.send('stop')
            process.exit()
            break
        case 'start':
            client.login(process.env.crystalKey)
            break
        case 'deploy':
            deployCommands(client, 'crystal')
            break
    }
})

process.send('ready')