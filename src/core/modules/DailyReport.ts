import { MessageOptions } from 'discord.js'
import { request } from 'undici'
import { generateEmbed } from '../utils/commonFunctions'

interface QuoteResponse {
    readonly data: {
        readonly contents: {
            readonly quotes: readonly {
                readonly quote: string,
                readonly author: string
            }[]
        }
    }
}

interface HolidayResponse {
    readonly data: readonly {
        readonly name: string,
        readonly description: string
    }[]
}

interface WeatherResponse {
    readonly data: {
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
        default:
            month = 'January'
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
        default:
            weekDay = 'Sunday'
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
            return '\u1F32B'
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
            return '\u1F327'
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
            return '\u1F328'
        case 1087:
        case 1273:
        case 1276:
        case 1279:
        case 1282:
            return '\u1F329'
        default:
            return '\u2753'
    }
}

export async function getDailyReport(date: Date): Promise<MessageOptions> {
    //meme of day
    const holiday: HolidayResponse = await (await request(`https://holidays.abstractapi.com/v1/?api_key=${process.env.abstractKey}&country=US&year=${date.getFullYear()}&month=${date.getMonth() + 1}&day=${date.getDate()}`)).body.json()
    const weather: WeatherResponse = await (await request(`http://api.weatherapi.com/v1/current.json?key=${process.env.weatherKey}&q=60069`)).body.json()
    const quote: QuoteResponse = await (await request(`http://quotes.rest/qod.json?category=inspire`)).body.json()
    const stringDate = getStringDate(date)
    const weatherEmoji = getWeatherEmoji(weather.data.current.condition.code)
    const response = { embeds: [ generateEmbed('info', {
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