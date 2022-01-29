import { ApplicationCommandOptionChoice, CommandInteraction, InteractionReplyOptions } from 'discord.js'
import Fuse from 'fuse.js'
import { GuildChatCommand } from '../../core/utils/command-types/guild-chat-command.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Info } from '../../core/utils/interfaces.js'

async function skipto(interaction: CommandInteraction, info: Info): Promise<InteractionReplyOptions> {
    if (info.queueManager.queue.length < 2) {
        return { embeds: [ generateEmbed('error', { title: 'The queue is too small to skip to a specific song!' }) ] }
    }
    await info.queueManager.skipTo(interaction.options.getInteger('index') ?? new Fuse(info.queueManager.queue, { keys: [ 'title' ] }).search(interaction.options.getString('title'))[0].refIndex + 1)
    return { embeds: [ generateEmbed('success', { title: 'Success!' }) ] }
}

function suggestions(option: ApplicationCommandOptionChoice, info: Info): ApplicationCommandOptionChoice[] {
    const results = new Fuse(info.queueManager.queue, { keys: [ 'title' ] }).search(option.value as string)
    const options: ApplicationCommandOptionChoice[] = []
    for (const result of results) {
        if (options.length > 3) {
            break
        }
        options.push({ name: result.item.title, value: result.item.title })
    }
    return options
}

export const command = new GuildChatCommand({
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
            minValue: 1,
            required: true,
        } ],
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
                autocomplete: true,
            } ],
        },
    ],
}, { respond: skipto, autocomplete: suggestions })