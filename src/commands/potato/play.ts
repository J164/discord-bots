import { type InteractionReplyOptions, ApplicationCommandOptionType, ChannelType } from 'discord.js';
import { type SpotifyResponse } from '../../types/api.js';
import { type PotatoChatCommand } from '../../types/bot-types/potato.js';
import { type QueueItem } from '../../types/voice.js';
import { EmbedType, responseOptions } from '../../util/builders.js';
import { QueueManager } from '../../voice/queue-manager.js';
import { resolve, resolvePlaylist, search } from '../../voice/ytdl.js';

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

	let songs;
	try {
		songs = await search(
			result.tracks.items.map((song) => {
				return `${song.track.name} ${song.track.artists[0].name}`;
			}),
		);
	} catch {
		return { success: false };
	}

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
	let playlist;
	try {
		playlist = await resolvePlaylist(link);
	} catch {
		return { success: false };
	}

	return {
		songs: playlist.results,
		response: responseOptions(EmbedType.Success, `Added playlist "${playlist.playlistTitle}" to queue!`, {
			fields: [{ name: 'URL:', value: link }],
			image: { url: playlist.results[0].thumbnail },
		}),
		success: true,
	};
}

async function youtube(link: string): Promise<AudioData<boolean>> {
	let songs;
	try {
		songs = await resolve(link);
	} catch {
		return { success: false };
	}

	return {
		songs,
		response: responseOptions(EmbedType.Success, `Added "${songs[0].title}" to queue!`, {
			fields: [{ name: 'URL:', value: songs[0].url }],
			image: { url: songs[0].thumbnail },
		}),
		success: true,
	};
}

async function misc(link: string): Promise<AudioData<boolean>> {
	let songs;
	try {
		songs = await search([link]);
	} catch {
		return { success: false };
	}

	return {
		songs,
		response: responseOptions(EmbedType.Success, `Added "${songs[0].title}" to queue!`, {
			fields: [{ name: 'URL:', value: songs[0].url }],
			image: { url: songs[0].thumbnail },
		}),
		success: true,
	};
}

export const command: PotatoChatCommand<'Guild'> = {
	data: {
		name: 'play',
		description: 'Play a song',
		options: [
			{
				name: 'name',
				description: 'The URL or title of the song',
				type: ApplicationCommandOptionType.String,
				required: true,
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
	ephemeral: true,
	type: 'Guild',
};
