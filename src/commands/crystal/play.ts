import { readdirSync } from 'node:fs';
import { ApplicationCommandOptionType, ChannelType } from 'discord.js';
import Fuse from 'fuse.js';
import type { CrystalChatCommand } from '../../types/bot-types/crystal.js';
import { EmbedType, responseOptions } from '../../util/builders.js';
import { Player } from '../../voice/player.js';
import { AudioTypes } from '../../types/voice.js';

export const command: CrystalChatCommand<'Guild'> = {
	data: {
		name: 'play',
		description: 'Play a song from the Naruto OST',
		options: [
			{
				name: 'naruto',
				description: 'Play a song from the Naruto OST',
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: 'name',
						description: 'The name of the song',
						type: ApplicationCommandOptionType.String,
						autocomplete: true,
						required: true,
					},
					{
						name: 'loop',
						description: 'Whether to loop the song',
						type: ApplicationCommandOptionType.Boolean,
						required: false,
					},
				],
			},
			{
				name: 'death_note',
				description: 'Play a song from the Death Note OST',
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: 'name',
						description: 'The name of the song',
						type: ApplicationCommandOptionType.String,
						autocomplete: true,
						required: true,
					},
					{
						name: 'loop',
						description: 'Whether to loop the song',
						type: ApplicationCommandOptionType.Boolean,
						required: false,
					},
				],
			},
			{
				name: 'subnautica',
				description: 'Play a song from the Subnautica OST',
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: 'name',
						description: 'The name of the song',
						type: ApplicationCommandOptionType.String,
						autocomplete: true,
						required: true,
					},
					{
						name: 'loop',
						description: 'Whether to loop the song',
						type: ApplicationCommandOptionType.Boolean,
						required: false,
					},
				],
			},
			{
				name: 'hollow_knight',
				description: 'Play a song from the Hollow Knight OST',
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: 'name',
						description: 'The name of the song',
						type: ApplicationCommandOptionType.String,
						autocomplete: true,
						required: true,
					},
					{
						name: 'loop',
						description: 'Whether to loop the song',
						type: ApplicationCommandOptionType.Boolean,
						required: false,
					},
				],
			},
			{
				name: 'undertale',
				description: 'Play a song from the Undertale OST',
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: 'name',
						description: 'The name of the song',
						type: ApplicationCommandOptionType.String,
						autocomplete: true,
						required: true,
					},
					{
						name: 'loop',
						description: 'Whether to loop the song',
						type: ApplicationCommandOptionType.Boolean,
						required: false,
					},
				],
			},
		],
	},
	async respond(response, guildInfo, globalInfo) {
		const voiceChannel = response.interaction.channel?.isVoiceBased() ? response.interaction.channel : response.interaction.member.voice.channel;
		if (!voiceChannel?.joinable || voiceChannel.type !== ChannelType.GuildVoice) {
			await response.interaction.editReply(responseOptions(EmbedType.Error, 'This command can only be used while in a visable voice channel!'));
			return;
		}

		const path = `${globalInfo.ostDirectory}/${response.interaction.options.getSubcommand()}_ost`;

		const songs = readdirSync(path).map((value) => {
			return value.split('.').slice(0, -1).join('.');
		});

		//const results = new Fuse(songs).search(response.interaction.options.getString('name', true));
		const results = [{ item: 'TEMP' }];

		await (guildInfo.player?.voiceChannel.id === voiceChannel.id ? guildInfo.player : (guildInfo.player = new Player(voiceChannel))).subscribe();
		await guildInfo.player.play({ type: AudioTypes.Local, url: `${path}/${results[0].item}.webm` });
		await response.interaction.editReply(responseOptions(EmbedType.Success, 'Now Playing!'));
	},
	async autocomplete(interaction, guildInfo, globalInfo) {
		if (interaction.options.getFocused().length < 3) {
			await interaction.respond([]);
			return;
		}

		const path = `${globalInfo.ostDirectory}/${interaction.options.getSubcommand(true)}_ost`;
		const songs = readdirSync(path).map((value) => {
			return value.split('.').slice(0, -1).join('.');
		});

		//const results = new Fuse(songs).search(interaction.options.getFocused());
		const results = [{ item: 'TEMP' }];

		await interaction.respond(
			results.slice(0, 25).map((result) => {
				return {
					name: result.item,
					value: result.item,
				};
			}),
		);
	},
	type: 'Guild',
};
