import axios from 'axios'
import { Client, ClientOptions, Collection, Intents, MessageEmbed, MessageOptions, TextChannel } from 'discord.js'
import { BaseCommand } from '../../core/BaseCommand'
import { deployCommands, getChannel, getCommands, getStringDate, getWeatherEmoji } from '../../core/commonFunctions'
import { config } from '../../core/constants'
import { DatabaseManager } from '../../core/DatabaseManager'
import { GuildInputManager } from '../../core/GuildInputManager'
import { HolidayResponse, QuoteResponse, WeatherResponse } from '../../core/interfaces'
import { potatoMessageParse } from '../../core/responseFunctions'
import { PotatoVoiceManager } from './PotatoVoiceManager'

process.on('uncaughtException', err => {
    if (err.message !== 'Unknown interaction') {
        console.log(err)
    }
})

const clientOptions: ClientOptions = { intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES ] }
let client = new Client(clientOptions)
let commands: Collection<string, BaseCommand>
const database = new DatabaseManager()
const guildStatus = new Map<string, GuildInputManager>()

async function dailyReport(date: Date): Promise<MessageOptions> {
    //meme of day
    const holiday: HolidayResponse = await axios.get(`https://holidays.abstractapi.com/v1/?api_key=${config.abstractKey}&country=US&year=${date.getFullYear()}&month=${date.getMonth() + 1}&day=${date.getDate()}`)
    const weather: WeatherResponse = await axios.get(`http://api.weatherapi.com/v1/current.json?key=${config.weatherKey}&q=60069`)
    const quote: QuoteResponse = await axios.get(`http://quotes.rest/qod.json?category=inspire`)
    console.log(holiday.data)
    const stringDate = getStringDate(date)
    const weatherEmoji = getWeatherEmoji(weather.data.current.condition.code)
    const response = { embeds: [ new MessageEmbed({
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
        ],
        color: 0x0099ff
    }) ] }
    if (holiday.data.length > 0) {
        response.embeds[0].addField(`Today is ${holiday.data[0].name}`, 'Have a great day!', false)
    }
    return response
}

function defineEvents() {
    client.on('ready', () => {
        console.log(`We have logged in as ${client.user.tag}`)
        process.send('start')

        client.user.setActivity(config.potatoStatus[Math.floor(Math.random() * config.potatoStatus.length)])

        getCommands(client, 'potato')
            .then(result => { commands = result })

        let broadcasted = false
        let broadcastChannel: TextChannel
        let date = new Date()

        getChannel(client, '619975185029922817', '775752263808974858')
            .then(channel => {
                broadcastChannel = <TextChannel> channel
                if (date.getHours() === 7) {
                    dailyReport(date)
                        .then(message => {
                            broadcastChannel.send(message)
                        })
                }
            })

        setInterval(() => {
            client.user.setActivity(config.potatoStatus[Math.floor(Math.random() * config.potatoStatus.length)])

            getCommands(client, 'potato')
                .then(result => { commands = result })

            for (const [ , guildManager ] of guildStatus) {
                guildManager.voiceManager.checkIsIdle()
            }

            date = new Date()

            if (date.getHours() === 7 && !broadcasted) {
                broadcasted = true
                dailyReport(date)
                    .then(message => {
                        broadcastChannel.send(message)
                    })
            } else if (date.getHours() === 8) {
                broadcasted = false
            }
        }, 60000)
    })

    client.on('messageCreate', message => {
        if (!guildStatus.has(message.guild.id)) {
            guildStatus.set(message.guild.id, new GuildInputManager(message.guild, commands, potatoMessageParse, database, new PotatoVoiceManager()))
        }

        guildStatus.get(message.guild.id).parseMessage(message)
    })

    client.on('interactionCreate', interaction => {
        if (!interaction.isCommand()) {
            return
        }

        if (!guildStatus.has(interaction.guild.id)) {
            guildStatus.set(interaction.guild.id, new GuildInputManager(interaction.guild, commands, potatoMessageParse, database, new PotatoVoiceManager()))
        }

        guildStatus.get(interaction.guild.id).parseCommand(interaction)
            .then(response => {
                if (response) {
                    interaction.editReply(response)
                }
            })
    })
}

process.on('message', arg => {
    switch (arg) {
        case 'stop':
            client.destroy()
            guildStatus.clear()
            console.log('Potato Bot has been logged out')
            process.send('stop')
            break
        case 'start':
            client = new Client(clientOptions)
            defineEvents()
            client.login(config.potatoKey)
            break
        case 'deploy':
            deployCommands(client, 'potato')
            break
        default:
            break
    }
})

process.send('ready')