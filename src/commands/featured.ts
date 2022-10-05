import type { InteractionReplyOptions } from 'discord.js';
import { ApplicationCommandOptionType, ChannelType } from 'discord.js';
import ytpl from 'ytpl';
import type { ChatCommand, GlobalChatCommandInfo, GuildInfo } from '../types/commands.js';
import { responseOptions } from '../util/builders.js';
import { QueueManager } from '../voice/queue-manager.js';

async function featured(globalInfo: GlobalChatCommandInfo<'Guild'>, guildInfo: GuildInfo): Promise<InteractionReplyOptions> {
	const voiceChannel = globalInfo.response.interaction.channel?.isVoiceBased()
		? globalInfo.response.interaction.channel
		: globalInfo.response.interaction.member.voice.channel;
	if (!voiceChannel?.joinable || voiceChannel.type !== ChannelType.GuildVoice) {
		return responseOptions('error', {
			title: 'This command can only be used in a voice channel!',
		});
	}

	let results;
	try {
		results = await ytpl(globalInfo.response.interaction.options.getString('name', true));
	} catch {
		return responseOptions('error', {
			title: 'Something went wrong. Please use /report to report the problem',
		});
	}

	const items = results.items.map((item) => {
		return {
			url: item.shortUrl,
			title: item.title,
			duration: item.duration ?? '',
			thumbnail: item.bestThumbnail.url ?? '',
		};
	});
	await QueueManager.play(guildInfo, voiceChannel, items, (globalInfo.response.interaction.options.getInteger('position') ?? 0) - 1);
	return responseOptions('success', {
		title: `Added playlist "${results.title}" to queue!`,
		image: { url: results.bestThumbnail.url ?? '' },
	});
}

export const command: ChatCommand<'Guild'> = {
	data: {
		name: 'featured',
		description: 'Play a song from the list of featured playlists',
		options: [
			{
				name: 'name',
				description: 'The name of the playlist',
				type: ApplicationCommandOptionType.String,
				required: true,
				choices: [
					{
						name: 'epic',
						value: 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY4lfQYkEb60nitxrJMpN5a2',
					},
					{
						name: 'magic',
						value: 'https://www.youtube.com/playlist?list=PLt3HR7cu4NMNUoQx1q5ullRMW-ZwosuNl',
					},
					{
						name: 'undertale',
						value: 'https://www.youtube.com/playlist?list=PLLSgIflCqVYMBjn63DEn0b6-sqKZ9xh_x',
					},
					{
						name: 'fun',
						value: 'https://www.youtube.com/playlist?list=PLE7yRMVm1hY77NZ6oE4PbkFarsOIyQcGD',
					},
				],
			},
			{
				name: 'position',
				description: 'Where in the queue to put the song (defaults to the end)',
				type: ApplicationCommandOptionType.Integer,
				minValue: 1,
				required: false,
			},
		],
	},
	respond: featured,
	ephemeral: true,
	type: 'Guild',
};
