import type {
	ButtonInteraction,
	InteractionUpdateOptions,
	MessageActionRowComponentBuilder,
	MessageComponentInteraction,
	SelectMenuBuilder,
	SelectMenuInteraction,
} from 'discord.js';
import { ActionRowBuilder, ApplicationCommandOptionType, ButtonStyle, ComponentType } from 'discord.js';
import type { GlobalChatCommandResponse } from '../../types/client.js';
import type { PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, Emojis, responseEmbed, responseOptions } from '../../util/builders.js';
import { mergeImages } from '../../util/image-utils.js';
import type { ScryfallResponse, ScryfallMagicCard } from '../../types/api.js';

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
				responseEmbed(EmbedType.Info, card.name, {
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
			responseEmbed(EmbedType.Info, card.name, {
				footer: {
					text: `Price ($): ${card.prices.usd ?? 'unknown (not for sale)'}`,
				},
				image: card.image_uris?.large ? { url: card.image_uris.large } : undefined,
			}),
		],
		components: [],
	};
}

async function updateResponse(response: GlobalChatCommandResponse, results: ScryfallMagicCard[][], page: number, component?: ButtonInteraction): Promise<void> {
	const reply = {
		embeds: [
			responseEmbed(EmbedType.Info, 'Results', {
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
			new ActionRowBuilder<SelectMenuBuilder>({
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
			}),
			new ActionRowBuilder<MessageActionRowComponentBuilder>({
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
			}),
		],
	};

	await (component ? component.update(reply) : response.interaction.editReply(reply));
	await promptUser(response, results, page);
}

async function promptUser(response: GlobalChatCommandResponse, scryfallResults: ScryfallMagicCard[][], page: number): Promise<void> {
	let component;
	try {
		component = (await response.awaitMessageComponent({
			filter: (b) => (b as MessageComponentInteraction).user.id === response.interaction.user.id,
			time: 300_000,
		})) as SelectMenuInteraction | ButtonInteraction;
	} catch {
		await response.interaction.editReply({ components: [] });
		return;
	}

	if (component.isSelectMenu()) {
		await component.update(await generateResponse(scryfallResults, page, Number.parseInt(component.values[0], 10) - 1));
		return;
	}

	switch (component.customId) {
		case 'jumpleft':
			await updateResponse(response, scryfallResults, 0, component);
			break;
		case 'left':
			await updateResponse(response, scryfallResults, page - 1, component);
			break;
		case 'right':
			await updateResponse(response, scryfallResults, page + 1, component);
			break;
		case 'jumpright':
			await updateResponse(response, scryfallResults, scryfallResults.length - 1, component);
			break;
	}
}

export const command: PotatoChatCommand<'Global'> = {
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
	async respond(response) {
		const searchTerm = response.interaction.options.getString('query', true);
		const searchResponse = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchTerm)}`);
		if (!searchResponse.ok) {
			await response.interaction.editReply(
				responseOptions(EmbedType.Error, 'Card Not Found', {
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

		const scryfallResults = formatResponse((await searchResponse.json()) as ScryfallResponse);

		await updateResponse(response, scryfallResults, 0);
	},
	ephemeral: true,
	type: 'Global',
};
