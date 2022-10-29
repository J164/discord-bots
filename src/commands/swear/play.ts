import { readdirSync } from 'node:fs';
import type { InteractionReplyOptions } from 'discord.js';
import { ApplicationCommandOptionType, ChannelType } from 'discord.js';
import { EmbedType, responseOptions } from '../../util/builders.js';
import type { SwearChatCommand } from '../../types/bot-types/swear.js';

async function getSongs(info: GuildChatCommandInfo): Promise<InteractionReplyOptions> {
	const voiceChannel = info.response.interaction.channel?.isVoiceBased() ? info.response.interaction.channel : info.response.interaction.member.voice.channel;
	if (!voiceChannel?.joinable || voiceChannel.type !== ChannelType.GuildVoice) {
		return responseOptions(EmbedType.Error, 'This command can only be used in a voice channel!');
	}

	const songs = readdirSync(`${config.DATA}/music_files/swear_songs/`);
	await info.voiceManager!.play(
		voiceChannel,
		`${config.DATA}/music_files/swear_songs/${
			info.response.interaction.options.getInteger('number') && info.response.interaction.options.getInteger('number')! <= songs.length
				? `${info.response.interaction.options.getInteger('number')!}.webm`
				: `${Math.floor(Math.random() * songs.length) + 1}.webm`
		}`,
	);
	return responseOptions(EmbedType.Success, 'Now Playing!');
}

export const command: SwearChatCommand<'Guild'> = {
	data: {
		name: 'play',
		description: "Play a swear song from Swear Bot's database",
		options: [
			{
				name: 'number',
				description: 'The song number',
				type: ApplicationCommandOptionType.Integer,
				minValue: 0,
				required: false,
			},
		],
	},
	respond: getSongs,
	type: 'Guild',
};
