import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { playBlackjack } from '../../core/modules/games/blackjack.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { Command } from '../../core/utils/interfaces.js'

async function blackjack(interaction: CommandInteraction): Promise<InteractionReplyOptions> {
    const dm = await interaction.user.createDM()
    void playBlackjack(dm)
    return { embeds: [ generateEmbed('success', { title: 'Success!' }) ] }
}

export const command: Command = { data: {
    name: 'blackjack',
    description: 'Play Blackjack',
}, execute: blackjack }
