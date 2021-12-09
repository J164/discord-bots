import { ApplicationCommandData, Client, Intents } from 'discord.js'
import { readdirSync, writeFileSync } from 'fs'
import { DatabaseManager } from '../../core/DatabaseManager'
import { InteractionManager } from '../../core/InteractionManager'

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
const interactionManager = new InteractionManager(new DatabaseManager())
const krenkoStatus = [ 'Shuffling cards', 'Building decks', 'Magic: The Gathering', 'Searching for new deck ideas' ]

client.once('ready', async () => {
    await interactionManager.getCommands(client, 'krenko')
    client.user.setActivity(krenkoStatus[Math.floor(Math.random() * krenkoStatus.length)])

    setInterval(() => {
        client.user.setActivity(krenkoStatus[Math.floor(Math.random() * krenkoStatus.length)])
    }, 60000)

    console.log('\x1b[42m', `We have logged in as ${client.user.tag}`, '\x1b[0m')
    process.send('start')
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
           // eslint-disable-next-line no-case-declarations
           const commandData: ApplicationCommandData[] = []
           for (const command of readdirSync('./dist/bots/krenko/commands').filter(file => file.endsWith('.js'))) {
               // eslint-disable-next-line @typescript-eslint/no-var-requires
               commandData.push(require(`./commands/${command}`).data)
           }
           client.application.commands.set(commandData)
           break
    }
})

process.send('ready')