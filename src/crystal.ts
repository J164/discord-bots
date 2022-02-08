import { Client, Intents } from 'discord.js'
import { InteractionManager } from './core/interaction-manager.js'
import { VoiceManager } from './core/voice/voice-manager.js'
import process from 'node:process'
import { setInterval } from 'node:timers'

const client = new Client({ intents: [ Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES ], partials: [ 'CHANNEL' ] })
const interactionManager = new InteractionManager()
const crystalStatus = [ 'Karl Needs a Bandage', 'The Agent Game', 'Gangster Town', 'The Running Game', 'The Games (Which one?)' ]

client.once('ready', async () => {
    client.user.setStatus('dnd')
    await InteractionManager.deployCommands(client, 'crystal')
    await interactionManager.getCommands(client, 'crystal')
    client.user.setActivity(crystalStatus[Math.floor(Math.random() * crystalStatus.length)])

    setInterval(() => {
        client.user.setActivity(crystalStatus[Math.floor(Math.random() * crystalStatus.length)])
        interactionManager.statusCheck()
    }, 60_000)

    client.user.setStatus('online')
    console.log(`\u001B[42m We have logged in as ${client.user.tag} \u001B[0m`)
})

client.on('interactionCreate', async interaction => {
    if (interaction.inGuild()) {
        interactionManager.addGuild(interaction.guildId, { voiceManager: new VoiceManager() })
    }

    if (interaction.isAutocomplete()) {
        const response = await interactionManager.autocomplete(interaction)
        try { void interaction.respond(response) } catch { /* prevent unknown interaction */ }
        return
    }

    if (!interaction.isCommand()) {
        return
    }

    const response = await interactionManager.parseChatCommand(interaction)
    if (response) {
        void interaction.editReply(response)
    }
})

void client.login(process.env.CRYSTALTOKEN)
