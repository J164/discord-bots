import { WebhookClient } from 'discord.js'
import process from 'node:process'
import { getDailyReport } from './core/modules/daily-report.js'

void new WebhookClient({ url: process.env.URL }).send(await getDailyReport(new Date()))