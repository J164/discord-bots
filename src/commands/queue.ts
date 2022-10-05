import type { InteractionReplyOptions, InteractionUpdateOptions } from 'discord.js';
import { ButtonStyle, ComponentType } from 'discord.js';
import type { ChatCommand, GlobalChatCommandInfo, GuildInfo } from '../types/commands.js';
import type { QueueItem } from '../types/voice.js';
import { Emojis, responseEmbed, responseOptions } from '../util/builders.js';
import type { QueueManager } from '../voice/queue-manager.js';

function response(
	info: GlobalChatCommandInfo<'Guild'>,
	queueManager: QueueManager,
	queue: QueueItem[],
	page: number,
): InteractionUpdateOptions & InteractionReplyOptions {
	void prompt(info, queueManager, queue, page);
	return {
		embeds: [
			responseEmbed('info', {
				title: queueManager.queueLoop ? 'Queue (Looping)' : 'Queue',
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
			},
		],
	};
}

async function prompt(info: GlobalChatCommandInfo<'Guild'>, queueManager: QueueManager, queue: QueueItem[], page: number) {
	let component;
	try {
		component = await info.response.awaitMessageComponent({
			filter: (b) => b.user.id === info.response.interaction.user.id,
			time: 300_000,
			componentType: ComponentType.Button,
		});
	} catch {
		void info.response.interaction.editReply({ components: [] }).catch();
		return;
	}

	switch (component.customId) {
		case 'jumpleft':
			void component.update(response(info, queueManager, queue, 0));
			break;
		case 'left':
			void component.update(response(info, queueManager, queue, page - 1));
			break;
		case 'right':
			void component.update(response(info, queueManager, queue, page + 1));
			break;
		case 'jumpright':
			void component.update(response(info, queueManager, queue, Math.floor(queue.length / 25)));
			break;
	}
}

function queue(globalInfo: GlobalChatCommandInfo<'Guild'>, guildInfo: GuildInfo): void {
	if (!guildInfo.queueManager?.nowPlaying) {
		void globalInfo.response.interaction.editReply(responseOptions('error', { title: 'There is no queue!' }));
		return;
	}

	void globalInfo.response.interaction.editReply(
		response(globalInfo, guildInfo.queueManager, [guildInfo.queueManager.nowPlaying, ...guildInfo.queueManager.queue], 0),
	);
}

export const command: ChatCommand<'Guild'> = {
	data: {
		name: 'queue',
		description: 'Get the song queue',
	},
	respond: queue,
	ephemeral: true,
	type: 'Guild',
};
