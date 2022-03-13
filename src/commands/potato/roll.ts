import { InteractionReplyOptions } from 'discord.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { GlobalChatCommand, GlobalChatCommandInfo } from '../../core/utils/interfaces.js'

async function roll(info: GlobalChatCommandInfo): Promise<InteractionReplyOptions> {
    const dice = info.interaction.options.getInteger('sides') ?? 6
    await info.interaction.editReply({ embeds: [ generateEmbed('info', { title: `Rolling a ${dice}-sided die...` }) ] })
    const diceResult = generateEmbed('info', { title: `${dice}-sided die result`, fields: [] })
    let chance = 10_000
    while (100 / dice * chance < 1) {
        chance *= 10
    }
    diceResult.fields.push({ name: `${Math.floor(Math.random() * (dice - 1) + 1)}`, value: `The chance of getting this result is about ${Math.round(100 / dice * chance) / chance}%` })
    return { embeds: [ diceResult ] }
}

export const command = new GlobalChatCommand({
    name: 'roll',
    description: 'Roll a die',
    options: [ {
        name: 'sides',
        description: 'How many sides on the die (defaults to 6)',
        type: 'INTEGER',
        minValue: 2,
        required: false,
    } ],
}, { respond: roll })