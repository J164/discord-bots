import { ApplicationCommandData, Client, Intents, TextChannel } from 'discord.js'
import { readdirSync, writeFileSync } from 'fs'
import { InteractionManager } from '../../core/InteractionManager.js'
import { QueueManager } from '../../core/voice/QueueManager.js'
import { getDailyReport } from '../../core/modules/DailyReport.js'

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
const interactionManager = new InteractionManager()
const potatoStatus = [ 'Eating a baked potato', 'Farming potatoes', 'Decorating with potatoes', 'Looking up potato recipes', 'Potato Platformer 3000' ]

client.once('ready', async () => {
    await interactionManager.getCommands(client, 'potato')
    client.user.setActivity(potatoStatus[Math.floor(Math.random() * potatoStatus.length)])

    let broadcasted = false
    const guild = await client.guilds.fetch('619975185029922817')
    const broadcastChannel = <TextChannel> await guild.channels.fetch('775752263808974858')
    let date = new Date()

    setInterval(async () => {
        client.user.setActivity(potatoStatus[Math.floor(Math.random() * potatoStatus.length)])
        interactionManager.statusCheck()

        date = new Date()

        if (date.getHours() === 7 && date.getMinutes() >= 30 && date.getMinutes() <= 35 && !broadcasted) {
            broadcasted = true
            broadcastChannel.send(await getDailyReport(date))
        } else if (date.getHours() === 8) {
            broadcasted = false
        }
    }, 60000)

    console.log(`\x1b[42m We have logged in as ${client.user.tag} \x1b[0m`)
    process.send('start')

    if (date.getHours() === 7 && date.getMinutes() >= 30 && date.getMinutes() <= 35) {
        broadcasted = true
        broadcastChannel.send(await getDailyReport(date))
    }
})

client.on('interactionCreate', async interaction => {
    if (!interaction.inGuild()) {
        return
    }

    interactionManager.addGuild(interaction.guildId, { queueManager: new QueueManager() })

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
            client.login(process.env.potatoKey)
            break
        case 'deploy':
            (async () => {
                const commandData: ApplicationCommandData[] = []
                for (const slash of readdirSync('./dist/bots/potato/commands').filter(file => file.endsWith('.js'))) {
                    const { command } = await import(`./commands/${slash}`)
                    commandData.push(command.data)
                }
                client.application.commands.set(commandData)
            })()
            break
    }
})

process.send('ready')