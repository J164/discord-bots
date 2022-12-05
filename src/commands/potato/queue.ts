import { type ButtonBuilder, type ButtonInteraction, ActionRowBuilder, ButtonStyle, ComponentType } from 'discord.js';
import { type GuildChatCommandResponse } from '../../types/client.js';
import { type PotatoChatCommand } from '../../types/bot-types/potato.js';
import { type QueueItem } from '../../types/voice.js';
import { EmbedType, Emojis, messageOptions, responseEmbed, responseOptions } from '../../util/builders.js';

async function updateResponse(response: GuildChatCommandResponse, queue: QueueItem[], page: number, component?: ButtonInteraction): Promise<void> {
	const reply = messageOptions({
		embeds: [
			responseEmbed(EmbedType.Info, 'Queue', {
				footer: { text: `${page + 1}/${Math.floor(queue.length / 25) + 1}` },
				fields: queue.slice(page * 25, (page + 1) * 25).map((entry, index) => {
					return {
						name: index === 0 && page === 0 ? 'Currently Playing:' : `${index + page * 25}.`,
						value: `${entry.title} (${entry.duration})\n${entry.url}`,
					};
				}),
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
						disabled: page === Math.floor(queue.length / 25),
					},
					{
						type: ComponentType.Button,
						customId: 'jumpright',
						emoji: Emojis.DoubleArrowRight,
						label: 'Jump to End',
						style: ButtonStyle.Secondary,
						disabled: page === Math.floor(queue.length / 25),
					},
				],
			}),
		],
	});

	await (component ? component.update(reply) : response.interaction.editReply(reply));
	await promptUser(response, queue, page);
}

async function promptUser(response: GuildChatCommandResponse, queue: QueueItem[], page: number) {
	let component;
	try {
		component = await response.awaitMessageComponent({
			filter: (b) => b.user.id === response.interaction.user.id,
			time: 300_000,
			componentType: ComponentType.Button,
		});
	} catch {
		await response.interaction.editReply(messageOptions({ components: [] }));
		return;
	}

	switch (component.customId) {
		case 'jumpleft': {
			await updateResponse(response, queue, 0, component);
			break;
		}

		case 'left': {
			await updateResponse(response, queue, page - 1, component);
			break;
		}

		case 'right': {
			await updateResponse(response, queue, page + 1, component);
			break;
		}

		case 'jumpright': {
			await updateResponse(response, queue, Math.floor(queue.length / 25), component);
			break;
		}
	}
}

export const command: PotatoChatCommand<'Guild'> = {
	data: {
		name: 'queue',
		description: 'Get the song queue',
	},
	async respond(response, guildInfo) {
		if (!guildInfo.queueManager?.nowPlaying) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, 'There is no queue!'));
			return;
		}

		await updateResponse(response, guildInfo.queueManager.queue, 0);
	},
	ephemeral: true,
	type: 'Guild',
};
