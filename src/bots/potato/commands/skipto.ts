import { ApplicationCommandData, ApplicationCommandOptionChoice, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import Fuse from 'fuse.js'
import { generateEmbed } from '../../../core/utils/commonFunctions'
import { GuildInfo } from '../../../core/utils/interfaces'

const data: ApplicationCommandData = {
    name: 'skipto',
    description: 'Pulls the selected song to the top of the queue and skips the current song',
    options: [
        {
        name: 'position',
        description: 'Skip to a song based on its position in the queue',
        type: 'SUB_COMMAND',
        options: [ {
            name: 'index',
            description: 'The position of the song to skip to',
            type: 'INTEGER',
            required: true
        } ]
        },
        {
            name: 'name',
            description: 'Skip to the first instance of a song based on its name',
            type: 'SUB_COMMAND',
            options: [ {
                name: 'title',
                description: 'The name of the song to skip to',
                type: 'STRING',
                required: true,
                autocomplete: true
            } ]
        }
    ]
}

function skipto(interaction: CommandInteraction, info: GuildInfo): InteractionReplyOptions {
    if (info.queueManager.getFlatQueue().length < 2) {
        return { embeds: [ generateEmbed('error', { title: 'The queue is too small to skip to a specific song!' }) ] }
    }
    info.queueManager.skipTo(interaction.options.getInteger('index') ?? new Fuse(info.queueManager.getFlatQueue(), { keys: [ 'title' ] }).search(interaction.options.getString('title'))[0].refIndex + 1)
    return { embeds: [ generateEmbed('success', { title: 'Success!' }) ] }
}

function suggestions(name: string, value: string, info: GuildInfo): ApplicationCommandOptionChoice[] {
    const results = new Fuse(info.queueManager.getFlatQueue(), { keys: [ 'title' ] }).search(value)
    const options: ApplicationCommandOptionChoice[] = []
    for (const result of results) {
        if (options.length > 3) {
            break
        }
        options.push({ name: result.item.title, value: result.item.title })
    }
    return options
}

module.exports = { data: data, execute: skipto, autocomplete: suggestions }