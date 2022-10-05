import type { InteractionReplyOptions, InteractionUpdateOptions } from 'discord.js';
import { ApplicationCommandOptionType, ButtonStyle, ComponentType } from 'discord.js';
import type { ChatCommand, GlobalChatCommandInfo } from '../types/commands.js';
import { Emojis, responseEmbed, responseOptions } from '../util/builders.js';
import { mergeImages } from '../util/image-utils.js';

function formatResponse(response: ScryfallResponse): ScryfallMagicCard[][] {
	const cards: ScryfallMagicCard[][] = [];
	for (let r = 0; r < Math.ceil(response.data.length / 5); r++) {
		cards.push([]);
		for (let index = 0; index < 5; index++) {
			if (r * 5 + index > response.data.length - 1) {
				break;
			}

			cards[r].push(response.data[r * 5 + index]);
		}
	}

	return cards;
}

async function generateResponse(results: ScryfallMagicCard[][], r: number, index: number): Promise<InteractionUpdateOptions> {
	const card = results[r][index];
	if (card.card_faces) {
		return {
			embeds: [
				responseEmbed('info', {
					title: card.name,
					footer: {
						text: `Price ($): ${card.prices.usd ?? 'unknown (not for sale)'}`,
					},
					image: { url: 'attachment://card.png' },
				}),
			],
			files: [
				{
					attachment: await mergeImages([card.card_faces[0].image_uris.large, card.card_faces[1].image_uris.large], 2),
					name: 'card.png',
				},
			],
			components: [],
		};
	}

	return {
		embeds: [
			responseEmbed('info', {
				title: card.name,
				footer: {
					text: `Price ($): ${card.prices.usd ?? 'unknown (not for sale)'}`,
				},
				image: card.image_uris?.large ? { url: card.image_uris.large } : undefined,
			}),
		],
		components: [],
	};
}

function response(
	globalInfo: GlobalChatCommandInfo<'Global'>,
	results: ScryfallMagicCard[][],
	page: number,
): InteractionUpdateOptions & InteractionReplyOptions {
	void prompt(globalInfo, results, page);
	return {
		embeds: [
			responseEmbed('info', {
				title: 'Results',
				footer: { text: `${page + 1}/${results.length}` },
				fields: results[page].map((entry, index) => {
					return {
						name: `${index + 1}.`,
						value: `${entry.name}`,
					};
				}),
			}),
		],
		components: [
			{
				type: ComponentType.ActionRow,
				components: [
					{
						type: ComponentType.SelectMenu,
						customId: 'options',
						placeholder: 'Select a Card',
						options: results[page].map((value, index) => {
							return {
								label: (index + 1).toString(),
								description: value.name,
								value: (index + 1).toString(),
							};
						}),
					},
				],
			},
			{
				type: ComponentType.ActionRow,
				components: [
					{
						type: ComponentType.Button,
						customId: 'jumpleft',
						emoji: Emojis.DoubleArrowLeft,
						label: 'Return to Beginning',
						style: ButtonStyle.Secondary,
						disabled: page === 0,
					},
					{
						type: ComponentType.Button,
						customId: 'left',
						emoji: Emojis.ArrowLeft,
						label: 'Previous Page',
						style: ButtonStyle.Secondary,
						disabled: page === 0,
					},
					{
						type: ComponentType.Button,
						customId: 'right',
						emoji: Emojis.ArrowRight,
						label: 'Next Page',
						style: ButtonStyle.Secondary,
						disabled: page === results.length - 1,
					},
					{
						type: ComponentType.Button,
						customId: 'jumpright',
						emoji: Emojis.DoubleArrowRight,
						label: 'Jump to End',
						style: ButtonStyle.Secondary,
						disabled: page === results.length - 1,
					},
				],
			},
		],
	};
}

async function prompt(globalInfo: GlobalChatCommandInfo<'Global'>, results: ScryfallMagicCard[][], page: number): Promise<void> {
	let component;
	try {
		component = await globalInfo.response.awaitMessageComponent({
			filter: (b) => b.user.id === globalInfo.response.interaction.user.id,
			time: 300_000,
		});
	} catch {
		void globalInfo.response.interaction.editReply({ components: [] });
		return;
	}

	if (component.isSelectMenu()) {
		void component.update(await generateResponse(results, page, Number.parseInt(component.values[0], 10) - 1));
		return;
	}

	switch (component.customId) {
		case 'jumpleft':
			void component.update(response(globalInfo, results, 0));
			break;
		case 'left':
			void component.update(response(globalInfo, results, page - 1));
			break;
		case 'right':
			void component.update(response(globalInfo, results, page + 1));
			break;
		case 'jumpright':
			void component.update(response(globalInfo, results, results.length - 1));
			break;
	}
}

async function search(globalInfo: GlobalChatCommandInfo<'Global'>): Promise<void> {
	const searchTerm = globalInfo.response.interaction.options.getString('query', true);
	const searchResponse = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchTerm)}`);
	if (!searchResponse.ok) {
		void globalInfo.response.interaction.editReply(
			responseOptions('error', {
				title: 'Card Not Found',
				fields: [
					{
						name: `${searchTerm} not found`,
						value: 'Check your spelling and/or try using a more general search term',
					},
				],
			}),
		);
		return;
	}

	const results = formatResponse((await searchResponse.json()) as ScryfallResponse);

	void globalInfo.response.interaction.editReply(response(globalInfo, results, 0));
}

export const command: ChatCommand<'Global'> = {
	data: {
		name: 'search',
		description: 'Search for Magic cards',
		options: [
			{
				name: 'query',
				description: 'What to search for',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
		],
	},
	respond: search,
	ephemeral: true,
	type: 'Global',
};
