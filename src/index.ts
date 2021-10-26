import { BotSubprocess } from './core/BotSubprocess'
import { createInterface } from 'readline'
import { writeFileSync } from 'fs'
import { config } from './core/utils/constants'
import Collection from '@discordjs/collection'

process.on('uncaughtException', err => {
    const date = new Date()
    writeFileSync(`${config.data}/logs/${date.getUTCMonth()}-${date.getUTCDate()}-${date.getUTCHours()}-${date.getUTCMinutes()}-${date.getUTCSeconds()}.txt`, `${err.name}\n${err.message}\n${err.stack}`)
    process.exit()
})

const bots = new Collection<string, BotSubprocess>([
    [ 'potato', new BotSubprocess('./dist/bots/potato/potato.js', 'Potato Bot') ],
    [ 'krenko', new BotSubprocess('./dist/bots/krenko/krenko.js', 'Krenko Bot') ],
    [ 'swear', new BotSubprocess('./dist/bots/swear/swear.js', 'Swear Bot') ],
    [ 'yeet', new BotSubprocess('./dist/bots/yeet/yeet.js', 'Yeet Bot') ]
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
        console.log('This command takes 1 parameter (Bot Name)')
        return
    }
    if (input[1] === 'all') {
        stopAll()
        return
    }
    const bot = bots.get(input[1])
    if (!bot) {
        console.log('Name not recognized')
        return
    }
    if (!bot.stop()) {
        console.log(`${bot.name} is already offline`)
    }
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
    const bot = bots.get(input[1])
    if (!bot) {
        console.log('Name not recognized')
        return
    }
    if (!bot.start()) {
        console.log(`${bot.name} is already online`)
    }
}

function list(): void {
    const [ online, offline ] = bots.partition(bot => bot.getOnline())
    for (const [ , bot ] of online) {
        console.log(`${bot.name}: `, '\x1b[42m', 'Online', '\x1b[0m')
    }
    for (const [ , bot ] of offline) {
        console.log(`${bot.name}: `, '\x1b[41m', 'Offline', '\x1b[0m')
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