import type { InteractionReplyOptions, InteractionUpdateOptions } from 'discord.js';
import { ButtonStyle, ComponentType } from 'discord.js';
import type { ChatCommand, GlobalChatCommandInfo } from '../types/commands.js';
import { Emojis, responseEmbed, responseOptions } from '../util/builders.js';

async function getDeckList(url: string): Promise<InteractionUpdateOptions> {
	const ids = /^(?:https?:\/\/)?(?:www\.)?deckstats\.net\/decks\/(\d+)\/(\d+)-[\dA-Za-z-]+$/.exec(url);
	if (!ids || ids.length < 3) {
		return responseOptions('error', { title: 'Please enter a valid deckstats deck url!' });
	}

	const apiUrl = `https://deckstats.net/api.php?action=get_deck&id_type=saved&owner_id=${ids[1]}&id=${ids[2]}&response_type=`;
	const decklist = await fetch(`${apiUrl}list`);
	if (!decklist.ok) {
		return responseOptions('error', { title: 'Deck list not found!' });
	}

	return {
		content: ((await decklist.json()) as { list: string }).list.match(/^([^\n!#/]+)/gm)?.join('\n'),
		embeds: [],
		components: [],
	};
}

async function response(
	globalInfo: GlobalChatCommandInfo<'Global'>,
	urls: Array<{ url: string }>,
	index: number,
): Promise<InteractionUpdateOptions & InteractionReplyOptions> {
	const ids = /^(?:https?:\/\/)?(?:www\.)?deckstats\.net\/decks\/(\d+)\/(\d+)-[\dA-Za-z-]+$/.exec(urls[index].url);
	if (!ids || ids.length < 3) {
		return responseOptions('error', { title: 'Please enter a valid deckstats deck url!' });
	}

	const apiUrl = `https://deckstats.net/api.php?action=get_deck&id_type=saved&owner_id=${ids[1]}&id=${ids[2]}&response_type=`;
	const response = await fetch(`${apiUrl}json`);
	if (!response.ok) {
		return responseOptions('error', { title: 'Deck not found!' });
	}

	const deck = (await response.json()) as DeckstatsResponse;
	let name: string | undefined;
	for (const section of deck.sections) {
		const commander = section.cards.findIndex((card) => card.isCommander);
		if (commander !== -1) {
			name = section.cards[commander].name;
		}
	}

	let image: string | undefined;
	if (name) {
		const infoResponse = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(name)}`);
		if (infoResponse.ok) {
			const cardInfo = (await infoResponse.json()) as ScryfallResponse;
			image = cardInfo.data[0].image_uris?.large;
		}
	}

	void prompt(globalInfo, urls, index);
	return {
		embeds: [
			responseEmbed('info', {
				title: deck.name,
				image: image ? { url: image } : undefined,
				fields: [{ name: 'Deckstats URL:', value: urls[index].url }],
				footer: { text: `${index + 1}/${urls.length}` },
			}),
		],
		components: [
			{
				type: ComponentType.ActionRow,
				components: [
					{
						type: ComponentType.Button,
						customId: 'jumpleft',
						emoji: Emojis.DoubleArrowLeft,
						label: 'Return to Beginning',
						style: ButtonStyle.Secondary,
						disabled: index === 0,
					},
					{
						type: ComponentType.Button,
						customId: 'left',
						emoji: Emojis.ArrowLeft,
						label: 'Previous Page',
						style: ButtonStyle.Secondary,
						disabled: index === 0,
					},
					{
						type: ComponentType.Button,
						customId: 'list',
						emoji: Emojis.Document,
						label: 'Decklist',
						style: ButtonStyle.Primary,
					},
					{
						type: ComponentType.Button,
						customId: 'right',
						emoji: Emojis.ArrowRight,
						label: 'Next Page',
						style: ButtonStyle.Secondary,
						disabled: index === urls.length - 1,
					},
					{
						type: ComponentType.Button,
						customId: 'jumpright',
						emoji: Emojis.DoubleArrowRight,
						label: 'Jump to End',
						style: ButtonStyle.Secondary,
						disabled: index === urls.length - 1,
					},
				],
			},
		],
	};
}

async function prompt(globalInfo: GlobalChatCommandInfo<'Global'>, urls: Array<{ url: string }>, index: number): Promise<void> {
	let component;
	try {
		component = await globalInfo.response.awaitMessageComponent({
			filter: (b) => b.user.id === globalInfo.response.interaction.user.id,
			time: 300_000,
			componentType: ComponentType.Button,
		});
	} catch {
		void globalInfo.response.interaction.editReply({ components: [] }).catch();
		return;
	}

	switch (component.customId) {
		case 'jumpleft':
			await component.update(await response(globalInfo, urls, 0));
			break;
		case 'left':
			await component.update(await response(globalInfo, urls, index - 1));
			break;
		case 'list':
			void component.update(await getDeckList(urls[index].url));
			return;
		case 'right':
			await component.update(await response(globalInfo, urls, index + 1));
			break;
		case 'jumpright':
			await component.update(await response(globalInfo, urls, urls.length - 1));
			break;
	}
}

async function getDeck(globalInfo: GlobalChatCommandInfo<'Global'>): Promise<void> {
	const urls = (await globalInfo.database.collection('mtg_decks').find({}).toArray()) as unknown as Array<{ url: string }>;
	void globalInfo.response.interaction.editReply(await response(globalInfo, urls, 0));
}

export const command: ChatCommand<'Global'> = {
	data: {
		name: 'decks',
		description: "Get a deck from Potato's database",
	},
	respond: getDeck,
	ephemeral: true,
	type: 'Global',
};
