import axios from 'axios'
import { Client, Intents, MessageOptions, TextChannel } from 'discord.js'
import { writeFileSync } from 'fs'
import { deployCommands, genericEmbed, getChannel, getCommands, getStringDate, getWeatherEmoji } from '../../core/utils/commonFunctions'
import { config, secrets } from '../../core/utils/constants'
import { DatabaseManager } from '../../core/DatabaseManager'
import { GuildInputManager } from '../../core/GuildInputManager'
import { Command, HolidayResponse, QuoteResponse, WeatherResponse } from '../../core/utils/interfaces'
import { QueueManager } from '../../core/voice/QueueManager'

process.on('unhandledRejection', (error: Error) => {
    if (error.name === 'FetchError') {
        process.exit()
    }
    if (error.message !== 'Unknown interaction') {
        const date = new Date()
        writeFileSync(`${config.data}/logs/${date.getUTCMonth()}-${date.getUTCDate()}-${date.getUTCHours()}-${date.getUTCMinutes()}-${date.getUTCSeconds()}-potato.txt`, `${error.name}\n${error.message}\n${error.stack}`)
        process.exit()
    }
})

const client = new Client({ intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES ] })
let commands: Map<string, Command>
const database = new DatabaseManager()
const guildStatus = new Map<string, GuildInputManager>()

async function dailyReport(date: Date): Promise<MessageOptions> {
    //meme of day
    const holiday: HolidayResponse = await axios.get(`https://holidays.abstractapi.com/v1/?api_key=${secrets.abstractKey}&country=US&year=${date.getFullYear()}&month=${date.getMonth() + 1}&day=${date.getDate()}`)
    const weather: WeatherResponse = await axios.get(`http://api.weatherapi.com/v1/current.json?key=${secrets.weatherKey}&q=60069`)
    const quote: QuoteResponse = await axios.get(`http://quotes.rest/qod.json?category=inspire`)
    const stringDate = getStringDate(date)
    const weatherEmoji = getWeatherEmoji(weather.data.current.condition.code)
    const response = { embeds: [ genericEmbed({
        title: `Daily Report: ${stringDate} ${weatherEmoji}`,
        fields: [
            {
                name: `Quote of the Day:`,
                value: `"${quote.data.contents.quotes[0].quote}" -${quote.data.contents.quotes[0].author}`,
                inline: false
            },
            {
                name: `In Linconshire is is ${weather.data.current.condition.text} and ${weather.data.current.temp_f}°F`,
                value: `It feels like ${weather.data.current.feelslike_f}°F and the wind speed is ${weather.data.current.wind_mph} mph`,
                inline: false
            }
        ]
    }) ] }
    if (holiday.data.length > 0) {
        response.embeds[0].addField(`Today is ${holiday.data[0].name}`, 'Have a great day!', false)
    }
    return response
}

client.on('ready', async () => {
    commands = await getCommands(client, 'potato')

    client.user.setActivity(config.potatoStatus[Math.floor(Math.random() * config.potatoStatus.length)])

    let broadcasted = false
    const broadcastChannel = <TextChannel>await getChannel(client, '619975185029922817', '775752263808974858')
    let date = new Date()

    setInterval(async () => {
        client.user.setActivity(config.potatoStatus[Math.floor(Math.random() * config.potatoStatus.length)])

        for (const [ , guildManager ] of guildStatus) {
            guildManager.statusCheck()
        }

        date = new Date()

        if (date.getHours() === 7 && !broadcasted) {
            broadcasted = true
            broadcastChannel.send(await dailyReport(date))
        } else if (date.getHours() === 8) {
            broadcasted = false
        }
    }, 60000)

    console.log('\x1b[42m', `We have logged in as ${client.user.tag}`, '\x1b[0m')
    process.send('start')

    if (date.getHours() === 7) {
        broadcastChannel.send(await dailyReport(date))
    }
})

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) {
        return
    }

    if (!guildStatus.has(interaction.guild.id)) {
        guildStatus.set(interaction.guild.id, new GuildInputManager(commands, { database: database, queueManager: new QueueManager() }))
    }

    const response = await guildStatus.get(interaction.guild.id).parseCommand(interaction)
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
            client.login(secrets.potatoKey)
            break
        case 'deploy':
            deployCommands(client, 'potato')
            break
        default:
            break
    }
})

process.send('ready')