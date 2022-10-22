import { ApplicationCommandOptionType } from 'discord.js';
import type { ChatCommand } from '../types/commands.js';
import { EmbedType, responseOptions } from '../util/builders.js';

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
	async respond(response, globalInfo) {
		const ids = /^(?:https?:\/\/)?(?:www\.)?deckstats\.net\/decks\/(\d+)\/(\d+)-[\dA-Za-z-]+$/.exec(response.interaction.options.getString('url', true));

		if (!ids) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, 'Please use a deck url from deckstats'));
			return;
		}

		if (await globalInfo.database.collection('mtg_decks').findOne({ url: response.interaction.options.getString('url') })) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, "Failed! (Make sure the deck isn't a duplicate)"));
			return;
		}

		const apiUrl = `https://deckstats.net/api.php?action=get_deck&id_type=saved&owner_id=${ids[1]}&id=${ids[2]}&response_type=`;
		const apiResponse = await fetch(`${apiUrl}json`);
		if (!apiResponse.ok) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, 'Please use a deck url from deckstats'));
			return;
		}

		const { name } = (await apiResponse.json()) as { name: string };

		await globalInfo.database.collection('mtg_decks').insertOne({
			url: response.interaction.options.getString('url'),
		});
		await response.interaction.editReply(responseOptions(EmbedType.Success, `Success! Deck "${name}" has been added!`));
	},
	type: 'Global',
};
