import { MessageOptions } from 'discord.js'
import { request } from 'undici'
import { generateEmbed } from '../utils/generators'

interface QuoteResponse {
    readonly contents: {
        readonly quotes: readonly {
            readonly quote: string,
            readonly author: string
        }[]
    }
}

interface Holidays {
    readonly name: string,
    readonly description: string
}

interface WeatherResponse {
    readonly current: {
        readonly temp_f: number,
        readonly condition: {
            readonly text: string,
            readonly code: number
        },
        readonly wind_mph: number,
        readonly feelslike_f: number
    }
}

// eslint-disable-next-line complexity
function getStringDate(date: Date): string {
    const day = date.getDate()
    const year = date.getFullYear()
    let month: string
    let weekDay: string
    switch (date.getMonth()) {
        case 0:
            month = 'January'
            break
        case 1:
            month = 'February'
            break
        case 2:
            month = 'March'
            break
        case 3:
            month = 'April'
            break
        case 4:
            month = 'May'
            break
        case 5:
            month = 'June'
            break
        case 6:
            month = 'July'
            break
        case 7:
            month = 'August'
            break
        case 8:
            month = 'September'
            break
        case 9:
            month = 'October'
            break
        case 10:
            month = 'November'
            break
        case 11:
            month = 'December'
            break
    }
    switch (date.getDay()) {
        case 0:
            weekDay = 'Sunday'
            break
        case 1:
            weekDay = 'Monday'
            break
        case 2:
            weekDay = 'Tuesday'
            break
        case 3:
            weekDay = 'Wednesday'
            break
        case 4:
            weekDay = 'Thursday'
            break
        case 5:
            weekDay = 'Friday'
            break
        case 6:
            weekDay = 'Saturday'
            break
    }
    return `${weekDay}, ${month} ${day}, ${year}`
}

// eslint-disable-next-line complexity
function getWeatherEmoji(weatherCode: number): string {
    switch (weatherCode) {
        case 1000:
            return '\u2600'
        case 1003:
            return '\u26C5'
        case 1006:
        case 1009:
            return '\u2601'
        case 1030:
        case 1135:
        case 1147:
            return '\uD83C\uDF2B\uFE0F'
        case 1063:
        case 1072:
        case 1150:
        case 1153:
        case 1168:
        case 1171:
        case 1180:
        case 1183:
        case 1186:
        case 1189:
        case 1192:
        case 1195:
        case 1198:
        case 1201:
        case 1240:
        case 1243:
        case 1246:
            return '\uD83C\uDF27\uFE0F'
        case 1066:
        case 1114:
        case 1117:
        case 1210:
        case 1213:
        case 1216:
        case 1219:
        case 1222:
        case 1225:
        case 1255:
        case 1258:
        case 1069:
        case 1204:
        case 1207:
        case 1237:
        case 1249:
        case 1252:
        case 1261:
        case 1264:
            return '\uD83C\uDF28\uFE0F'
        case 1087:
        case 1273:
        case 1276:
        case 1279:
        case 1282:
            return '\uD83C\uDF29\uFE0F'
    }
}

export async function getDailyReport(date: Date): Promise<MessageOptions> {
    // todo meme of day
    const holiday: Holidays[] = await (await request(`https://holidays.abstractapi.com/v1/?api_key=${process.env.abstractKey}&country=US&year=${date.getFullYear()}&month=${date.getMonth() + 1}&day=${date.getDate()}`)).body.json()
    const weather: WeatherResponse = await (await request(`http://api.weatherapi.com/v1/current.json?key=${process.env.weatherKey}&q=60069`)).body.json()
    const quote: QuoteResponse = await (await request(`http://quotes.rest/qod.json?category=inspire`)).body.json()
    const stringDate = getStringDate(date)
    const weatherEmoji = getWeatherEmoji(weather.current.condition.code)
    const response = { embeds: [ generateEmbed('info', {
        title: `Daily Report: ${stringDate}\t${weatherEmoji}`,
        fields: [
            {
                name: `Quote of the Day:`,
                value: `"${quote.contents.quotes[0].quote}" -${quote.contents.quotes[0].author}`,
                inline: false
            },
            {
                name: `In Linconshire is is ${weather.current.condition.text} and ${weather.current.temp_f}°F`,
                value: `It feels like ${weather.current.feelslike_f}°F and the wind speed is ${weather.current.wind_mph} mph`,
                inline: false
            }
        ]
    }) ] }
    if (holiday.length > 0) {
        response.embeds[0].addField(`Today is ${holiday[0].name}`, 'Have a great day!', false)
    }
    return response
}