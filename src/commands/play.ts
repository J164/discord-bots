import type { InteractionReplyOptions } from 'discord.js';
import { ApplicationCommandOptionType, ChannelType } from 'discord.js';
import ytpl from 'ytpl';
import ytsr from 'ytsr';
import type { ChatCommand } from '../types/commands.js';
import type { QueueItem } from '../types/voice.js';
import { EmbedType, responseOptions } from '../util/builders.js';
import { QueueManager } from '../voice/queue-manager.js';
import { resolve } from '../voice/ytdl.js';

type AudioData<T extends boolean> = T extends true ? { success: true; response: InteractionReplyOptions; songs: QueueItem[] } : { success: false };

async function spotify(link: string, spotifyToken: string): Promise<AudioData<boolean>> {
	const authorizationRequest = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			Authorization: `Basic ${spotifyToken}`,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: 'grant_type=client_credentials',
	});

	if (!authorizationRequest.ok) {
		return { success: false };
	}

	const { access_token } = (await authorizationRequest.json()) as { access_token: string };

	const playlistId = /^(?:https?:\/\/)?(?:www\.)?open\.spotify\.com\/playlist\/([A-Za-z\d-_]+)$/.exec(link);
	if (!playlistId || playlistId.length < 2) {
		return { success: false };
	}

	const resultResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId[1]}`, {
		method: 'GET',
		headers: { Authorization: `Bearer ${access_token}` },
	});

	if (!resultResponse.ok) {
		return { success: false };
	}

	const result = (await resultResponse.json()) as SpotifyResponse;

	const songs: QueueItem[] = [];
	const search = async (track: SpotifyTrack) => {
		const filterMap = await ytsr.getFilters(`${track.name} ${track.artists[0].name}`);
		const filter = filterMap.get('Type')?.get('Video')?.url;
		if (!filter) {
			return;
		}

		const { results, items } = await ytsr(filter, {
			limit: 1,
		});
		if (results < 1) {
			return;
		}

		const { url, title, duration, bestThumbnail } = items[0] as ytsr.Video;
		songs.push({
			url,
			title,
			duration: duration ?? '',
			thumbnail: bestThumbnail.url ?? '',
		});
	};

	await Promise.all(
		result.tracks.items.map(async (song) => {
			return search(song.track);
		}),
	);

	return {
		songs,
		response: responseOptions(EmbedType.Success, `Added "${result.name}" to queue!`, {
			fields: [
				{
					name: 'URL:',
					value: result.external_urls.spotify,
				},
			],
			image: { url: result.images[0].url },
		}),
		success: true,
	};
}

async function youtubePlaylist(link: string): Promise<AudioData<boolean>> {
	let result;
	try {
		result = await ytpl(link);
	} catch {
		return { success: false };
	}

	return {
		songs: result.items.map(({ shortUrl, title, duration, bestThumbnail }) => {
			return {
				url: shortUrl,
				title,
				duration: duration ?? '',
				thumbnail: bestThumbnail.url ?? '',
			};
		}),
		response: responseOptions(EmbedType.Success, `Added playlist "${result.title}" to queue!`, {
			fields: [{ name: 'URL:', value: link }],
			image: { url: result.bestThumbnail.url ?? '' },
		}),
		success: true,
	};
}

async function youtube(link: string): Promise<AudioData<boolean>> {
	let result;
	try {
		result = await resolve(link);
	} catch {
		return { success: false };
	}

	const hour = Math.floor(result.duration / 3600);
	const min = Math.floor((result.duration % 3600) / 60);
	const sec = result.duration % 60;

	return {
		songs: [
			{
				url: result.webpage_url,
				title: result.title,
				duration: `${hour > 0 ? (hour < 10 ? `0${hour}:` : `${hour}:`) : ''}${min < 10 ? `0${min}` : min}:${sec < 10 ? `0${sec}` : sec}`,
				thumbnail: result.thumbnail,
			},
		],
		response: responseOptions(EmbedType.Success, `Added "${result.title}" to queue!`, {
			fields: [{ name: 'URL:', value: result.webpage_url }],
			image: { url: result.thumbnail },
		}),
		success: true,
	};
}

async function misc(link: string): Promise<AudioData<boolean>> {
	const filterMap = await ytsr.getFilters(link);
	const filter = filterMap.get('Type')?.get('Video')?.url;
	if (!filter) {
		return { success: false };
	}

	const term = await ytsr(filter, {
		limit: 1,
	});
	if (term.results < 1) {
		return { success: false };
	}

	const { url, title, duration, bestThumbnail } = term.items[0] as ytsr.Video;

	return {
		songs: [
			{
				url,
				title,
				duration: duration ?? '',
				thumbnail: bestThumbnail.url ?? '',
			},
		],
		response: responseOptions(EmbedType.Success, `Added "${title}" to queue!`, {
			fields: [{ name: 'URL:', value: url }],
			image: { url: bestThumbnail.url ?? '' },
		}),
		success: true,
	};
}

export const command: ChatCommand<'Guild'> = {
	data: {
		name: 'play',
		description: 'Play a song',
		options: [
			{
				name: 'name',
				description: 'The URL or title of the song',
				type: ApplicationCommandOptionType.String,
				required: true,
				autocomplete: true,
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
	async respond(response, guildInfo, globalInfo) {
		const voiceChannel = response.interaction.channel?.isVoiceBased() ? response.interaction.channel : response.interaction.member.voice.channel;
		if (!voiceChannel?.joinable || voiceChannel.type !== ChannelType.GuildVoice) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, 'This command can only be used in a voice channel!'));
			return;
		}

		await response.interaction.editReply(responseOptions(EmbedType.Info, 'Boiling potatoes...'));

		const link = response.interaction.options.getString('name', true).trim();

		let parsed: AudioData<boolean>;
		if (/^(?:https?:\/\/)?(?:www\.)?open\.spotify\.com\/playlist\/([A-Za-z\d-_&=?]+)$/.test(link)) {
			parsed = await spotify(link, globalInfo.spotifyToken);
		} else if (/^(?:https?:\/\/)?(?:www\.)?youtube\.com\/playlist\?list=([A-Za-z\d-_&=?]+)$/.test(link)) {
			parsed = await youtubePlaylist(link);
		} else if (/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([A-Za-z\d-_&=?]+)$/.test(link)) {
			parsed = await youtube(link);
		} else {
			parsed = await misc(link);
		}

		if (!parsed.success) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, 'Song not found'));
			return;
		}

		await (guildInfo.queueManager ??= new QueueManager(voiceChannel)).addToQueue(
			voiceChannel,
			parsed.songs,
			(response.interaction.options.getInteger('position') ?? 0) - 1,
		);

		await response.interaction.editReply(parsed.response);
	},
	async autocomplete(interaction) {
		const value = interaction.options.getFocused();
		if (
			value.length < 3 ||
			/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([A-Za-z\d-_&=?]+)$/.test(value) ||
			/^(?:https?:\/\/)?(?:www\.)?open\.spotify\.com\/playlist\/([A-Za-z\d-_&=?]+)$/.test(value)
		) {
			await interaction.respond([]);
			return;
		}

		const filterMap = await ytsr.getFilters(value);
		const filter = filterMap.get('Type')?.get('Video')?.url;
		if (!filter) {
			await interaction.respond([]);
			return;
		}

		const results = await ytsr(filter, {
			limit: 4,
		});
		const options = (results.items as ytsr.Video[]).map((result) => {
			return {
				name: result.title,
				value: result.url,
			};
		});
		await interaction.respond(options);
	},
	ephemeral: true,
	type: 'Guild',
};
