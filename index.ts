process.on('uncaughtException', err => {
    setInterval(function () { console.log(err) }, 1000)
})

import { BotSubprocess } from './src/core/BotSubprocess'
import { createInterface } from 'readline'
import { refreshData } from './src/core/common'

setInterval(function () { refreshData() }, 60000)

const bots = BotSubprocess.bots
const consoleInterface = createInterface({
    input: process.stdin,
    output: process.stdout
})

async function startAll(): Promise<void> {
    for (const [ , bot ] of bots) {
        bot.start()
    }
}

async function stopAll(): Promise<void> {
    for (const [ , bot ] of bots) {
        bot.stop()
    }
    process.exit()
}

function stop(input: string[]): void {
    if (input.length < 2) {
        console.log('This command takes 1 parameter (Bot Name)')
        return
    }
    if (input[1] === 'all') {
        stopAll()
        return
    }
    for (const [ key, bot ] of bots) {
        if (key === input[1]) {
            if (!bot.stop()) {
                console.log(`${bot.name} is already offline`)
            }
            return
        }
    }
    console.log('Name not recognized')
}

function start(input: string[]): void {
    if (input.length < 2) {
        console.log('This command takes 1 parameter (Bot Name)')
        return
    }
    if (input[1] === 'all') {
        startAll()
        return
    }
    for (const [ key, bot ] of bots) {
        if (key === input[1]) {
            if (!bot.start()) {
                console.log(`${bot.name} is already online`)
                break
            }
            return
        }
    }
    console.log('Name not recognized')
}

function list(): void {
    for (const [ , bot ] of bots) {
        if (bot.getOnline()) {
            console.log(`${bot.name}: `, '\x1b[42m', 'Online', '\x1b[0m')
        } else {
            console.log(`${bot.name}: `, '\x1b[41m', 'Offline', '\x1b[0m')
        }
    }
}

function prompt(): void {
    consoleInterface.question('', (input) => {
        const parsedInput = input.split(' ')
        switch (parsedInput[0]) {
            case 'stop':
                stop(parsedInput)
                break
            case 'start':
                start(parsedInput)
                break
            case 'list':
                list()
                break
            default:
                console.log('start <name> (start a bot or use "all" to start all of them')
                console.log('stop <name> (stop a bot or use "all" to stop all of them')
                console.log('list (list all bots and their running status')
                break
        }
        prompt()
    })
}

prompt()