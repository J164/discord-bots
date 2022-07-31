import { MessageOptions } from 'discord.js';
import { Db } from 'mongodb';
import config from '../config.json' assert { type: 'json' };
import { Emojis, responseEmbed } from '../util/builders.js';
import { WeatherResponse } from './weather-report.js';

/**
 * Response data from zenquotes
 */
interface Quote {
  readonly q: string;
  readonly a: string;
}

/**
 * Response data from the holiday API
 */
interface Holiday {
  readonly name: string;
  readonly description: string;
}

type MonthNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
type DayNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Uses a node date object to make a human readable date
 * @param date node date object
 * @returns readable date string
 */
function getStringDate(date: Date): string {
  const day = date.getDate();
  const year = date.getFullYear();
  let month: string;
  let weekDay: string;
  switch (date.getMonth() as MonthNumber) {
    case 0:
      month = 'January';
      break;
    case 1:
      month = 'February';
      break;
    case 2:
      month = 'March';
      break;
    case 3:
      month = 'April';
      break;
    case 4:
      month = 'May';
      break;
    case 5:
      month = 'June';
      break;
    case 6:
      month = 'July';
      break;
    case 7:
      month = 'August';
      break;
    case 8:
      month = 'September';
      break;
    case 9:
      month = 'October';
      break;
    case 10:
      month = 'November';
      break;
    case 11:
      month = 'December';
      break;
  }
  switch (date.getDay() as DayNumber) {
    case 0:
      weekDay = 'Sunday';
      break;
    case 1:
      weekDay = 'Monday';
      break;
    case 2:
      weekDay = 'Tuesday';
      break;
    case 3:
      weekDay = 'Wednesday';
      break;
    case 4:
      weekDay = 'Thursday';
      break;
    case 5:
      weekDay = 'Friday';
      break;
    case 6:
      weekDay = 'Saturday';
      break;
  }
  return `${weekDay}, ${month} ${day}, ${year}`;
}

/**
 * Takes a weather API weather code and converts it to an emoji
 * @param weatherCode code from the weather API representing the weather
 * @returns emoji representing the weather
 */
// eslint-disable-next-line complexity
function getWeatherEmoji(weatherCode: number): string {
  switch (weatherCode) {
    case 1000:
      return '\u2600';
    case 1003:
      return '\u26C5';
    case 1006:
    case 1009:
      return '\u2601';
    case 1030:
    case 1135:
    case 1147:
      return '\uD83C\uDF2B\uFE0F';
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
      return '\uD83C\uDF27\uFE0F';
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
      return '\uD83C\uDF28\uFE0F';
    case 1087:
    case 1273:
    case 1276:
    case 1279:
    case 1282:
      return '\uD83C\uDF29\uFE0F';
    default:
      return Emojis.QuestionMark;
  }
}

/**
 * Generates a daily report based on the date
 * @param date the date to generate a daily report for
 * @param weather the daily weather to use to generate the report
 * @param database MongoDB database connection object
 * @returns the daily report as message options
 */
export async function getDailyReport(date: Date, weather: WeatherResponse, database: Db): Promise<MessageOptions> {
  const holiday = (await (
    await fetch(
      `https://holidays.abstractapi.com/v1/?api_key=${config.ABSTRACT_KEY}&country=US&year=${date.getFullYear()}&month=${
        date.getMonth() + 1
      }&day=${date.getDate()}`,
    )
  ).json()) as Holiday[];
  const quote = (await (await fetch('https://zenquotes.io?api=today')).json()) as Quote[];

  const embeds = [
    responseEmbed('info', {
      title: `Daily Report: ${getStringDate(date)}\t${getWeatherEmoji(weather.forecast.forecastday[0].day.condition.code)}`,
      fields: [
        {
          name: `Quote of the Day:`,
          value: `"${quote[0].q}" -${quote[0].a}`,
        },
        {
          name: `In Linconshire the high is ${weather.forecast.forecastday[0].day.maxtemp_f}°F and the low is ${weather.forecast.forecastday[0].day.mintemp_f}°F`,
          value: `It will be ${weather.forecast.forecastday[0].day.condition.text.toLowerCase()} today`,
        },
        {
          name: `Sunrise today is at ${weather.forecast.forecastday[0].astro.sunrise} and sunset is at ${weather.forecast.forecastday[0].astro.sunset}`,
          value: `Today's moon phase is ${weather.forecast.forecastday[0].astro.moon_phase.toLowerCase()}`,
        },
        {
          name: holiday.length > 0 ? `Today is ${holiday[0].name}` : 'Today is whatever you make it!',
          value: 'Have a great day!',
        },
      ],
    }),
  ];
  if (weather.forecast.forecastday[0].day.daily_will_it_rain === 1) {
    embeds.push(responseEmbed('info', { title: 'Watch out! It may rain today!\t\u2602\uFE0F' }));
  } else if (weather.forecast.forecastday[0].day.daily_will_it_snow === 1) {
    embeds.push(responseEmbed('info', { title: 'Watch out! It may snow today!\t\u2744\uFE0F' }));
  }
  const birthday = (await database.collection('birthdays').findOne({ month: date.getMonth() + 1, day: date.getDate() })) as unknown as {
    id: string;
    month: number;
    day: number;
  };
  if (birthday) {
    embeds.push({ title: '\uD83C\uDF89\tHave an amazing birthday!', color: 0x99_00_ff });
    return { embeds: embeds, content: `\uD83C\uDF89\tHappy Birthday <@${birthday.id}>!!!\t\uD83C\uDF89` };
  }
  return { embeds: embeds };
}
