import { WebhookClient } from 'discord.js'
import process from 'node:process'
import { setInterval } from 'node:timers'
import { getDailyReport } from './core/modules/daily-report.js'

const client = new WebhookClient({ url: process.env.URL })

let broadcasted = false
let date = new Date()

setInterval(async () => {
    date = new Date()

    if (date.getHours() === 7 && date.getMinutes() >= 30 && date.getMinutes() <= 35 && !broadcasted) {
        broadcasted = true
        void client.send(await getDailyReport(date))
    } else if (date.getHours() === 8) {
        broadcasted = false
    }
}, 60_000)