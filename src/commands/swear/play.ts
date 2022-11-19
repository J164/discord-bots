import { readdirSync } from 'node:fs';
import { ApplicationCommandOptionType, ChannelType } from 'discord.js';
import { EmbedType, responseOptions } from '../../util/builders.js';
import { type SwearChatCommand } from '../../types/bot-types/swear.js';
import { Player } from '../../voice/player.js';
import { AudioTypes } from '../../types/voice.js';

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
	async respond(response, guildInfo) {
		const voiceChannel = response.interaction.channel?.isVoiceBased() ? response.interaction.channel : response.interaction.member.voice.channel;
		if (!voiceChannel?.joinable || voiceChannel.type !== ChannelType.GuildVoice) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, 'This command can only be used in a voice channel!'));
			return;
		}

		const songs = readdirSync('./swear_songs');

		await (guildInfo.player?.voiceChannel.id === voiceChannel.id ? guildInfo.player : (guildInfo.player = new Player(voiceChannel))).subscribe();
		await guildInfo.player.play({
			type: AudioTypes.Local,
			url: `./swear_songs/${
				response.interaction.options.getInteger('number') && response.interaction.options.getInteger('number', true) <= songs.length
					? `${response.interaction.options.getInteger('number', true)}.webm`
					: `${Math.floor(Math.random() * songs.length) + 1}.webm`
			}`,
		});

		await response.interaction.editReply(responseOptions(EmbedType.Success, 'Now Playing!'));
	},
	type: 'Guild',
};
