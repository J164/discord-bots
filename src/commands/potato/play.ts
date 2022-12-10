import { type InteractionReplyOptions, ApplicationCommandOptionType, ChannelType } from 'discord.js';
import { type PotatoChatCommand } from '../../types/bot-types/potato.js';
import { EmbedType, responseOptions } from '../../util/helpers.js';
import { SPOTFIY_PLAYLIST_URL_PATTERN, YOUTUBE_PLAYLIST_URL_PATTERN, YOUTUBE_VIDEO_URL_PATTERN } from '../../util/regex.js';
import { YoutubeAudio } from '../../voice/audio-resource.js';
import { QueueManager } from '../../voice/queue-manager.js';
import { resolve, search } from '../../voice/ytdl.js';

type AudioData = { response: InteractionReplyOptions; songs: YoutubeAudioData[] };

async function spotify(link: string, spotifyToken: string): Promise<AudioData | undefined> {
	const authorizationRequest = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			Authorization: `Basic ${spotifyToken}`,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: 'grant_type=client_credentials',
	});

	if (!authorizationRequest.ok) {
		return;
	}

	const { access_token } = (await authorizationRequest.json()) as { access_token: string };

	const playlistId = SPOTFIY_PLAYLIST_URL_PATTERN.exec(link);
	if (!playlistId || playlistId.length < 2) {
		return;
	}

	const resultResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId[1]}`, {
		method: 'GET',
		headers: { Authorization: `Bearer ${access_token}` },
	});

	if (!resultResponse.ok) {
		return;
	}

	const result = (await resultResponse.json()) as SpotifyResponse;

	const songs = await search(
		result.tracks.items.map((song) => {
			return `${song.track.name} ${song.track.artists[0].name}`;
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
	};
}

async function youtubePlaylist(link: string): Promise<AudioData> {
	const playlist = await resolve(link, true);

	return {
		songs: playlist,
		response: responseOptions(EmbedType.Success, `Added playlist "${playlist[0].playlistTitle}" to queue!`, {
			fields: [{ name: 'URL:', value: link }],
			image: { url: playlist[0].thumbnail },
		}),
	};
}

async function youtube(link: string): Promise<AudioData> {
	const songs = await resolve(link);

	return {
		songs,
		response: responseOptions(EmbedType.Success, `Added "${songs[0].title}" to queue!`, {
			fields: [{ name: 'URL:', value: songs[0].url }],
			image: { url: songs[0].thumbnail },
		}),
	};
}

async function misc(link: string): Promise<AudioData> {
	const songs = await search([link]);

	return {
		songs,
		response: responseOptions(EmbedType.Success, `Added "${songs[0].title}" to queue!`, {
			fields: [{ name: 'URL:', value: songs[0].url }],
			image: { url: songs[0].thumbnail },
		}),
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

		let songs;
		if (SPOTFIY_PLAYLIST_URL_PATTERN.test(link)) {
			songs = await spotify(link, globalInfo.spotifyToken);
		} else if (YOUTUBE_PLAYLIST_URL_PATTERN.test(link)) {
			songs = await youtubePlaylist(link);
		} else if (YOUTUBE_VIDEO_URL_PATTERN.test(link)) {
			songs = await youtube(link);
		} else {
			songs = await misc(link);
		}

		if (!songs) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, 'Song not found'));
			return;
		}

		await (guildInfo.queueManager ??= new QueueManager(voiceChannel)).addToQueue(
			voiceChannel,
			songs.songs.map((song) => {
				return {
					audio: new YoutubeAudio(song.url),
					url: song.url,
					duration: song.duration,
					thumbnail: song.thumbnail,
					title: song.title,
				};
			}),
			(response.interaction.options.getInteger('position') ?? 0) - 1,
		);

		await response.interaction.editReply(songs.response);
	},
	ephemeral: true,
	type: 'Guild',
};
