import { CommandInteraction, InteractionReplyOptions } from 'discord.js'
import { playBlackjack } from '../../core/modules/games/blackjack.js'
import { ChatCommand } from '../../core/utils/command-types/chat-command.js'
import { generateEmbed } from '../../core/utils/generators.js'

async function blackjack(interaction: CommandInteraction): Promise<InteractionReplyOptions> {
    const dm = await interaction.user.createDM()
    void playBlackjack(dm)
    return { embeds: [ generateEmbed('success', { title: 'Success!' }) ] }
}

export const command = new ChatCommand({
    name: 'blackjack',
    description: 'Play Blackjack',
}, { respond: blackjack })
