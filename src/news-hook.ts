import { WebhookClient } from 'discord.js'
import process from 'node:process'
import { getDailyReport } from './core/modules/daily-report.js'

await new WebhookClient({ url: process.env.URL }).send(await getDailyReport(new Date()))
// eslint-disable-next-line unicorn/no-process-exit
process.exit()