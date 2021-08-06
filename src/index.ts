process.on('uncaughtException', err => {
    setInterval(() => { console.log(err) }, 1000)
})

import { BotSubprocess } from './core/BotSubprocess'
import { createInterface } from 'readline'

const bots = new Map<string, BotSubprocess>([
    [ 'potato', new BotSubprocess('./bots/potato/potato.js', 'Potato Bot') ],
    [ 'krenko', new BotSubprocess('./bots/krenko/krenko.js', 'Krenko Bot') ],
    [ 'swear', new BotSubprocess('./bots/swear/swear.js', 'Swear Bot') ],
    [ 'yeet', new BotSubprocess('./bots/yeet/yeet.js', 'Yeet Bot') ]
])

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

async function deploy(): Promise<void> {
    for (const [ , bot ] of bots) {
        bot.deploy()
    }
    console.log('Success')
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

async function celebrate(): Promise<void> {
    for (const [ , bot ] of bots) {
        bot.send('celebrate')
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
            case 'celebrate':
                celebrate()
                break
            case 'deploy':
                deploy()
                break
            default:
                console.log('start <name> (start a bot or use "all" to start all of them)')
                console.log('stop <name> (stop a bot or use "all" to stop all of them)')
                console.log('list (list all bots and their running status)')
                console.log('deploy (Deploys all slash commands)')
                break
        }
        prompt()
    })
}

prompt()