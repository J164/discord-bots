import { ApplicationCommandData, Client, Intents } from 'discord.js'
import { readdirSync, writeFileSync } from 'fs'
import { DatabaseManager } from '../../core/DatabaseManager.js'
import { InteractionManager } from '../../core/InteractionManager.js'
import { VoiceManager } from '../../core/voice/VoiceManager.js'

process.on('unhandledRejection', (error: Error) => {
    if (error.name === 'FetchError') {
        process.exit()
    }
    if (error.message !== 'Unknown interaction') {
        const date = new Date()
        writeFileSync(`${process.env.data}/logs/${date.getUTCMonth()}-${date.getUTCDate()}-${date.getUTCHours()}-${date.getUTCMinutes()}-${date.getUTCSeconds()}-swear.txt`, `${error.name}\n${error.message}\n${error.stack}`)
        process.exit()
    }
})

const client = new Client({ intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES ] })
const interactionManager = new InteractionManager(new DatabaseManager())
const swearStatus = [ 'Reading the Swear Dictionary', 'Singing Swears', 'Arresting people who don\'t swear', 'Inventing new swears' ]

client.once('ready', async () => {
    await interactionManager.getCommands(client, 'swear')
    client.user.setActivity(swearStatus[Math.floor(Math.random() * swearStatus.length)])

    setInterval(() => {
        client.user.setActivity(swearStatus[Math.floor(Math.random() * swearStatus.length)])
        interactionManager.statusCheck()
    }, 60000)

    console.log(`\x1b[42m We have logged in as ${client.user.tag} \x1b[0m`)
    process.send('start')
})

client.on('interactionCreate', async interaction => {
    if (!interaction.inGuild()) {
        return
    }

    interactionManager.addGuild(interaction.guildId, { voiceManager: new VoiceManager() })

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

process.on('message', arg => {
    switch (arg) {
        case 'stop':
            client.destroy()
            console.log(`\x1b[41m ${client.user.tag} has been logged out \x1b[0m`)
            process.send('stop')
            process.exit()
            break
        case 'start':
            client.login(process.env.swearKey)
            break
        case 'deploy':
            (async () => {
                const commandData: ApplicationCommandData[] = []
                for (const slash of readdirSync('./dist/bots/swear/commands').filter(file => file.endsWith('.js'))) {
                    const { command } = await import(`./commands/${slash}`)
                    commandData.push(command.data)
                }
                client.application.commands.set(commandData)
            })()
            break
    }
})

process.send('ready')