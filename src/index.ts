import { BotSubprocess } from './core/BotSubprocess'
import { createInterface } from 'readline'
import { readFileSync, writeFileSync } from 'fs'

const config = JSON.parse(readFileSync('./assets/data/config.json', { encoding: 'utf8' }))

process.on('uncaughtException', err => {
    const date = new Date()
    writeFileSync(`${config.data}/logs/${date.getUTCMonth()}-${date.getUTCDate()}-${date.getUTCHours()}-${date.getUTCMinutes()}-${date.getUTCSeconds()}.txt`, `${err.name}\n${err.message}\n${err.stack}`)
    process.exit()
})

const bots = new Map<string, BotSubprocess>([
    [ 'potato', new BotSubprocess('./dist/bots/potato/potato.js', 'Potato Bot', config) ],
    [ 'krenko', new BotSubprocess('./dist/bots/krenko/krenko.js', 'Krenko Bot', config) ],
    [ 'swear', new BotSubprocess('./dist/bots/swear/swear.js', 'Swear Bot', config) ],
    [ 'yeet', new BotSubprocess('./dist/bots/yeet/yeet.js', 'Yeet Bot', config) ],
    [ 'crystal', new BotSubprocess('./dist/bots/crystal/crystal.js', 'Crystal Bot', config) ]
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
    setInterval(() => {
        for (const [ , bot ] of bots) {
            if (bot.getOnline()) {
                return
            }
        }
        process.exit()
    }, 2000)
}

async function deploy(): Promise<void> {
    for (const [ , bot ] of bots) {
        bot.deploy()
    }
    console.log('If no errors are logged, deploy occurred successfully')
}

function stop(input: string[]): void {
    if (input.length < 2) {
        console.warn('This command takes 1 parameter (Bot Name)')
        return
    }
    if (input[1] === 'all') {
        stopAll()
        return
    }
    const bot = bots.get(input[1])
    if (!bot) {
        console.warn('Name not recognized')
        return
    }
    if (!bot.stop()) {
        console.warn(`${bot.name} is already offline`)
    }
}

function start(input: string[]): void {
    if (input.length < 2) {
        console.warn('This command takes 1 parameter (Bot Name)')
        return
    }
    if (input[1] === 'all') {
        startAll()
        return
    }
    const bot = bots.get(input[1])
    if (!bot) {
        console.warn('Name not recognized')
        return
    }
    if (!bot.start()) {
        console.warn(`${bot.name} is already online`)
    }
}

function list(): void {
    for (const [ , bot ] of bots) {
        console.log(bot.getOnline() ? `${bot.name}: \x1b[42m Online \x1b[0m` : '\x1b[41m Offline \x1b[0m')
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