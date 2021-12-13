import { ApplicationCommandData, Client, Intents, TextChannel } from 'discord.js'
import { readdirSync } from 'fs'
import { InteractionManager } from '../../core/InteractionManager'
import { QueueManager } from '../../core/voice/QueueManager'
import { getDailyReport } from '../../core/modules/DailyReport'

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
            // eslint-disable-next-line no-case-declarations
            const commandData: ApplicationCommandData[] = []
            for (const command of readdirSync('./dist/bots/potato/commands').filter(file => file.endsWith('.js'))) {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                commandData.push(require(`./commands/${command}`).data)
            }
            client.application.commands.set(commandData)
            break
    }
})

process.send('ready')