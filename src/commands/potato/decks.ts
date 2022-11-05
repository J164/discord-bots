import type { ButtonBuilder, ButtonInteraction, InteractionUpdateOptions } from 'discord.js';
import { ActionRowBuilder, ButtonStyle, ComponentType } from 'discord.js';
import type { GlobalChatCommandResponse } from '../../types/client.js';
import type { PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, Emojis, responseEmbed, responseOptions } from '../../util/builders.js';
import type { DeckstatsResponse, ScryfallResponse } from '../../types/api.js';

async function getDeckList(url: string): Promise<InteractionUpdateOptions> {
	const ids = /^(?:https?:\/\/)?(?:www\.)?deckstats\.net\/decks\/(\d+)\/(\d+)-[\dA-Za-z-]+$/.exec(url);
	if (!ids || ids.length < 3) {
		return responseOptions(EmbedType.Error, 'Please enter a valid deckstats deck url!');
	}

	const apiUrl = `https://deckstats.net/api.php?action=get_deck&id_type=saved&owner_id=${ids[1]}&id=${ids[2]}&response_type=`;
	const decklist = await fetch(`${apiUrl}list`);
	if (!decklist.ok) {
		return responseOptions(EmbedType.Error, 'Deck list not found!');
	}

	return {
		content: ((await decklist.json()) as { list: string }).list.match(/^([^\n!#/]+)/gm)?.join('\n'),
		embeds: [],
		components: [],
	};
}

async function updateResponse(response: GlobalChatCommandResponse, urls: Array<{ url: string }>, index: number, component?: ButtonInteraction): Promise<void> {
	const ids = /^(?:https?:\/\/)?(?:www\.)?deckstats\.net\/decks\/(\d+)\/(\d+)-[\dA-Za-z-]+$/.exec(urls[index].url);
	if (!ids || ids.length < 3) {
		const reply = { embeds: [responseEmbed(EmbedType.Error, 'Please enter a valid deckstats deck url!')], components: [] };
		await (component ? component.update(reply) : response.interaction.editReply(reply));
		return;
	}

	const apiUrl = `https://deckstats.net/api.php?action=get_deck&id_type=saved&owner_id=${ids[1]}&id=${ids[2]}&response_type=`;
	const apiResponse = await fetch(`${apiUrl}json`);
	if (!apiResponse.ok) {
		const reply = { embeds: [responseEmbed(EmbedType.Error, 'Deck not found!')], components: [] };
		await (component ? component.update(reply) : response.interaction.editReply(reply));
		return;
	}

	const deck = (await apiResponse.json()) as DeckstatsResponse;
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

	const reply = {
		embeds: [
			responseEmbed(EmbedType.Info, deck.name, {
				image: image ? { url: image } : undefined,
				fields: [{ name: 'Deckstats URL:', value: urls[index].url }],
				footer: { text: `${index + 1}/${urls.length}` },
			}),
		],
		components: [
			new ActionRowBuilder<ButtonBuilder>({
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
			}),
		],
	};

	await (component ? component.update(reply) : response.interaction.editReply(reply));
	await promptUser(response, urls, index);
}

async function promptUser(response: GlobalChatCommandResponse, urls: Array<{ url: string }>, index: number): Promise<void> {
	let component;
	try {
		component = await response.awaitMessageComponent({
			filter: (b) => b.user.id === response.interaction.user.id,
			time: 300_000,
			componentType: ComponentType.Button,
		});
	} catch {
		await response.interaction.editReply({ components: [] });
		return;
	}

	switch (component.customId) {
		case 'jumpleft':
			await updateResponse(response, urls, 0);
			break;
		case 'left':
			await updateResponse(response, urls, index - 1);
			break;
		case 'list':
			await component.update(await getDeckList(urls[index].url));
			return;
		case 'right':
			await updateResponse(response, urls, index + 1);
			break;
		case 'jumpright':
			await updateResponse(response, urls, urls.length - 1);
			break;
	}
}

export const command: PotatoChatCommand<'Global'> = {
	data: {
		name: 'decks',
		description: "Get a deck from Potato's database",
	},
	async respond(response, globalInfo) {
		const urls = (await globalInfo.database.collection('mtg_decks').find({}).toArray()) as unknown as Array<{ url: string }>;
		await updateResponse(response, urls, 0);
	},
	ephemeral: true,
	type: 'Global',
};
