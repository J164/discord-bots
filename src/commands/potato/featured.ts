import { ApplicationCommandOptionType, ChannelType } from 'discord.js';
import ytpl from 'ytpl';
import type { PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, responseOptions } from '../../util/builders.js';
import { QueueManager } from '../../voice/queue-manager.js';

export const command: PotatoChatCommand<'Guild'> = {
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
	async respond(response, guildInfo) {
		const voiceChannel = response.interaction.channel?.isVoiceBased() ? response.interaction.channel : response.interaction.member.voice.channel;
		if (!voiceChannel?.joinable || voiceChannel.type !== ChannelType.GuildVoice) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, 'This command can only be used in a voice channel!'));
			return;
		}

		let results;
		try {
			results = await ytpl(response.interaction.options.getString('name', true));
		} catch {
			await response.interaction.editReply(responseOptions(EmbedType.Error, 'Something went wrong. Please use /report to report the problem'));
			return;
		}

		const items = results.items.map((item) => {
			return {
				url: item.shortUrl,
				title: item.title,
				duration: item.duration ?? '',
				thumbnail: item.bestThumbnail.url ?? '',
			};
		});

		await (guildInfo.queueManager ??= new QueueManager(voiceChannel)).addToQueue(
			voiceChannel,
			items,
			(response.interaction.options.getInteger('position') ?? 0) - 1,
		);

		await response.interaction.editReply(
			responseOptions(EmbedType.Success, `Added playlist "${results.title}" to queue!`, {
				image: { url: results.bestThumbnail.url ?? '' },
			}),
		);
	},
	ephemeral: true,
	type: 'Guild',
};
