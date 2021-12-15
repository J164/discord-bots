import { ApplicationCommandData, Client, Intents } from 'discord.js'
import { readdirSync, writeFileSync } from 'fs'
import { InteractionManager } from '../../core/InteractionManager.js'

process.on('unhandledRejection', (error: Error) => {
    if (error.name === 'FetchError') {
        process.exit()
    }
    if (error.message !== 'Unknown interaction') {
        const date = new Date()
        writeFileSync(`${process.env.data}/logs/${date.getUTCMonth()}-${date.getUTCDate()}-${date.getUTCHours()}-${date.getUTCMinutes()}-${date.getUTCSeconds()}-yeet.txt`, `${error.name}\n${error.message}\n${error.stack}`)
        process.exit()
    }
})

const client = new Client({ intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES ] })
const interactionManager = new InteractionManager()
//const yeetStreaks = new Map<Snowflake, { number: number, time: number }>()
const yeetStatus = [ 'Yeeting the Child', 'YA YEEEEEEEEEET', 'Yeeting People off Cliffs', 'Yeeting Washing Machines' ]

client.once('ready', async () => {
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
    }, 60000)

    console.log(`\x1b[42m We have logged in as ${client.user.tag} \x1b[0m`)
    process.send('start')
})

client.on('messageCreate', message => {
    if (!message.guild || message.author.bot) {
        return
    }

    const input = message.content.toLowerCase()
    if (input.match(/(\W|^)yee+t(\W|$)/)) {
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
        if (input.substr(input.indexOf('yee') + 1, 10) === 'eeeeeeeeee') {
            message.reply('Wow! Much Yeet!')
            return
        }
        message.reply('YEEEEEEEEEET!')
    }
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

process.on('message', arg => {
    switch (arg) {
        case 'stop':
            client.destroy()
            console.log(`\x1b[41m ${client.user.tag} has been logged out \x1b[0m`)
            process.send('stop')
            process.exit()
            break
        case 'start':
            client.login(process.env.yeetKey)
            break
        case 'deploy':
            // eslint-disable-next-line no-case-declarations
            const commandData: ApplicationCommandData[] = []
            for (const command of readdirSync('./dist/bots/yeet/commands').filter(file => file.endsWith('.js'))) {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                commandData.push(require(`./commands/${command}`).data)
            }
            client.application.commands.set(commandData)
            break
    }
})

process.send('ready')