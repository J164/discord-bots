import { InteractionReplyOptions } from 'discord.js'
import { playBlackjack } from '../../core/modules/games/blackjack.js'
import { generateEmbed } from '../../core/utils/generators.js'
import { GlobalChatCommand, GlobalChatCommandInfo } from '../../core/utils/interfaces.js'

async function blackjack(info: GlobalChatCommandInfo): Promise<InteractionReplyOptions> {
    void playBlackjack(await info.interaction.user.createDM())
    return { embeds: [ generateEmbed('success', { title: 'Success!' }) ] }
}

export const command = new GlobalChatCommand({
    name: 'blackjack',
    description: 'Play Blackjack',
}, { respond: blackjack })
