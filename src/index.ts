import { readdir } from 'node:fs/promises';
import type {
	ApplicationCommandOptionChoiceData,
	AutocompleteInteraction,
	CacheType,
	ChatInputCommandInteraction,
	InteractionReplyOptions,
	TextChannel,
} from 'discord.js';
import { ActivityType, Client, GatewayIntentBits, InteractionType, Partials } from 'discord.js';
import { MongoClient } from 'mongodb';
import cron from 'node-cron';
import { environment } from './config.js';
import { getDailyReport } from './modules/daily-report.js';
import { gradeReport } from './modules/grade-report.js';
import { getWeatherReport } from './modules/weather-report.js';
import type { ChatCommand, ChatCommandResponse, GuildInfo } from './types/commands.js';
import { responseOptions } from './util/builders.js';
import { logger } from './util/logger.js';

const config = await environment();

const guildInfo = new Map<string, GuildInfo>();
const commands = new Map<string, ChatCommand<'Global' | 'Guild'>>();
const databaseClient = new MongoClient(config.MONGODB_URL);
let weather = await getWeatherReport(new Date(), config.WEATHER_KEY);

/**
 * Imports a command from the specified file
 * @param fileName The file to import the command from
 */
async function importCommand(fileName: string) {
	const { command } = (await import(`./commands/${fileName}`)) as { command: ChatCommand<'Global' | 'Guild'> };
	commands.set(command.data.name, command);
}

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
	partials: [Partials.Channel],
	presence: {
		activities: [
			{
				name: config.STATUS,
				type: ActivityType.Playing,
			},
		],
	},
});

client.once('ready', async () => {
	await databaseClient.connect();

	const commandFiles = await readdir('./dist/commands');

	await Promise.all(
		commandFiles
			.filter((file) => file.endsWith('.js'))
			.map(async (file) => {
				return importCommand(file);
			}),
	);

	const weatherTask = cron.schedule('0 0 * * *', async (date) => {
		try {
			weather = await getWeatherReport(date, config.WEATHER_KEY);
		} catch (error) {
			logger.error(error, 'Weather Report threw an error');
			weatherTask.stop();
		}
	});

	const announcementTask = cron.schedule(config.ANNOUNCEMENT_TIME, async (date) => {
		try {
			void ((await client.channels.fetch(config.ANNOUNCEMENT_CHANNEL)) as TextChannel).send(
				await getDailyReport(date, databaseClient.db(config.DATABASE_NAME), config.ABSTRACT_KEY, weather),
			);
		} catch (error) {
			logger.error(error, 'Daily Announcement threw an error');
			announcementTask.stop();
		}
	});

	const gradeTask = cron.schedule(config.GRADE_UPDATE_INTERVAL, async () => {
		try {
			const report = await gradeReport(config.IRC_TOKEN, databaseClient.db(config.DATABASE_NAME), gradeTask);
			if (!report) return;
			const admin = await client.users.fetch(config.ADMIN);
			const dm = await admin.createDM();
			void dm.send({
				embeds: [report],
			});
		} catch (error) {
			logger.error(error, 'Grade Monitor threw an error');
			gradeTask.stop();
		}
	});

	client.on('interactionCreate', async (interaction) => {
		if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
			let response: ApplicationCommandOptionChoiceData[];
			try {
				response = await autocompleteChatCommand(interaction);
			} catch (error) {
				logger.info({ options: interaction.options.data }, `(${interaction.id}) /${interaction.commandName}`);
				logger.error(error, `Chat Command Autocomplete #${interaction.id} threw an error`);
				response = [];
			}

			void interaction.respond(response).catch();
			return;
		}

		if (!interaction.isChatInputCommand()) return;

		logger.info({ options: interaction.options.data }, `(${interaction.id}) /${interaction.commandName}`);

		let response;
		try {
			response = await respondChatCommand(interaction);
		} catch (error) {
			logger.error(error, `Chat Command Interaction #${interaction.id} threw an error`);
			response = responseOptions('error', { title: 'Something went wrong!' });
		}

		if (response) {
			void interaction.editReply(response).catch();
		}
	});

	logger.info(`\u001B[42m We have logged in! \u001B[0m`);
});

/**
 * Returns the response to a ChatInputCommandInteraction
 * @param interaction The ChatInputCommandInteraction to respond to
 * @returns A Promise resolving to the response to send to Discord or nothing if the command doesn't give a response
 */
async function respondChatCommand(interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | void> {
	const command = commands.get(interaction.commandName);

	if (!command) {
		return responseOptions('error', { title: `Command ${interaction.commandName} not found!` });
	}

	const interactionResponse = (await interaction.deferReply({ ephemeral: command.ephemeral })) as ChatCommandResponse<CacheType>;

	if (command.allowedUsers && !command.allowedUsers.includes(interaction.user.id)) {
		return responseOptions('info', { title: 'You are not registered to use this command!' });
	}

	const globalData = {
		response: interactionResponse as ChatCommandResponse<'cached'>,
		database: databaseClient.db(config.DATABASE_NAME),
		weather,
		spotifyToken: config.SPOTIFY_TOKEN,
		announcementChannel: config.ANNOUNCEMENT_CHANNEL,
		downloadDirectory: config.DOWNLOAD_DIRECTORY,
		ircToken: config.IRC_TOKEN,
	};

	if (command.type === 'Guild') {
		if (!interaction.inCachedGuild()) {
			return responseOptions('error', {
				title: 'This is a server only command!',
			});
		}

		const guildData = guildInfo.get(interaction.guildId) ?? { queueManager: undefined };
		guildInfo.set(interaction.guildId, guildData);

		return command.respond(globalData, guildData);
	}

	return command.respond({
		response: interactionResponse,
		database: databaseClient.db(config.DATABASE_NAME),
		weather,
		spotifyToken: config.SPOTIFY_TOKEN,
		announcementChannel: config.ANNOUNCEMENT_CHANNEL,
		downloadDirectory: config.DOWNLOAD_DIRECTORY,
		ircToken: config.IRC_TOKEN,
	});
}

/**
 * Returns the response to an AutocompleteInteraction
 * @param interaction The AutocompleteInteraction to respond to
 * @returns A Promise resolving to an array of suggestions to send to Discord
 */
async function autocompleteChatCommand(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoiceData[]> {
	const command = commands.get(interaction.commandName);

	if (!command?.autocomplete) {
		return [];
	}

	if (command.allowedUsers && !command.allowedUsers.includes(interaction.user.id)) {
		return [];
	}

	const globalData = {
		interaction,
		database: databaseClient.db(config.DATABASE_NAME),
		weather,
		spotifyToken: config.SPOTIFY_TOKEN,
		announcementChannel: config.ANNOUNCEMENT_CHANNEL,
		downloadDirectory: config.DOWNLOAD_DIRECTORY,
		ircToken: config.IRC_TOKEN,
	};

	if (command.type === 'Guild') {
		if (!interaction.inCachedGuild()) return [];

		const guildData = guildInfo.get(interaction.guildId) ?? { queueManager: undefined };
		guildInfo.set(interaction.guildId, guildData);

		return command.autocomplete(globalData, guildData);
	}

	return command.autocomplete(globalData);
}

void client.login(config.TOKEN);
