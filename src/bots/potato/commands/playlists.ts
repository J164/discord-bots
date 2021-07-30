import { ApplicationCommandData, InteractionReplyOptions } from 'discord.js'
import { BaseCommand } from '../../../core/BaseCommand'
import { genericEmbedResponse } from '../../../core/common'

const data: ApplicationCommandData = {
    name: 'playlists',
    description: 'Get a list of featured playlists and their URLs'
}

function playlists(): InteractionReplyOptions {
    return { embeds: [ genericEmbedResponse('Playlists')
        .addField('Epic Mix', 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY4lfQYkEb60nitxrJMpN5a2')
        .addField('Undertale Mix', 'https://www.youtube.com/playlist?list=PLLSgIflCqVYMBjn63DEn0b6-sqKZ9xh_x')
        .addField('MTG Parodies', 'https://www.youtube.com/playlist?list=PLt3HR7cu4NMNUoQx1q5ullRMW-ZwosuNl')
        .addField('Bully Maguire', 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY6QzsEh8F5N7J02ngFcE4w_')
        .addField('Star Wars Parodies', 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY79M_MgSuRg-U0Y9t-5n_Hk')
        .addField('Fun Mix', 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY77NZ6oE4PbkFarsOIyQcGD') ] }
}

module.exports = new BaseCommand(data, playlists)