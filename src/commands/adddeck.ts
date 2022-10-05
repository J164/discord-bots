import type { InteractionReplyOptions } from 'discord.js';
import { ApplicationCommandOptionType } from 'discord.js';
import type { ChatCommand, GlobalChatCommandInfo } from '../types/commands.js';
import { responseOptions } from '../util/builders.js';

async function addDeck(globalInfo: GlobalChatCommandInfo<'Global'>): Promise<InteractionReplyOptions> {
	const ids = /^(?:https?:\/\/)?(?:www\.)?deckstats\.net\/decks\/(\d+)\/(\d+)-[\dA-Za-z-]+$/.exec(
		globalInfo.response.interaction.options.getString('url', true),
	);

	if (!ids) {
		return responseOptions('error', {
			title: 'Please use a deck url from deckstats',
		});
	}

	if (await globalInfo.database.collection('mtg_decks').findOne({ url: globalInfo.response.interaction.options.getString('url') }))
		return responseOptions('error', {
			title: "Failed! (Make sure the deck isn't a duplicate)",
		});

	const apiUrl = `https://deckstats.net/api.php?action=get_deck&id_type=saved&owner_id=${ids[1]}&id=${ids[2]}&response_type=`;
	const response = await fetch(`${apiUrl}json`);
	if (!response.ok) {
		return responseOptions('error', {
			title: 'Please use a deck url from deckstats',
		});
	}

	const { name } = (await response.json()) as { name: string };

	await globalInfo.database.collection('mtg_decks').insertOne({
		url: globalInfo.response.interaction.options.getString('url'),
	});
	return responseOptions('success', {
		title: `Success! Deck "${name}" has been added!`,
	});
}

export const command: ChatCommand<'Global'> = {
	data: {
		name: 'adddeck',
		description: "Add a deck to Potato's database",
		options: [
			{
				name: 'url',
				description: 'Deckstats URL for the new deck',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
		],
	},
	respond: addDeck,
	type: 'Global',
};
