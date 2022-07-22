import {
  ActivityType,
  ApplicationCommandOptionChoiceData,
  AutocompleteInteraction,
  CacheType,
  ChatInputApplicationCommandData,
  ChatInputCommandInteraction,
  Client,
  GatewayIntentBits,
  InteractionReplyOptions,
  InteractionResponse,
  InteractionType,
  Partials,
  TextChannel,
} from 'discord.js';
import { Db, MongoClient } from 'mongodb';
import cron from 'node-cron';
import { readdirSync } from 'node:fs';
import config from './config.json' assert { type: 'json' };
import { getDailyReport } from './modules/daily-report.js';
import { gradeReport } from './modules/grade-report.js';
import { responseOptions } from './util/builders.js';
import { logger } from './util/logger.js';
import { QueueManager } from './voice/queue-manager.js';

interface GlobalInfo {
  readonly database: Db;
}

interface GuildInfo {
  readonly queueManager: QueueManager;
}

type ChatCommandResponse<T extends CacheType> = Omit<InteractionResponse, 'interaction'> & {
  interaction: ChatInputCommandInteraction<T>;
};

export type GlobalChatCommandInfo = GlobalInfo & {
  readonly response: ChatCommandResponse<CacheType>;
};
export type GlobalAutocompleteInfo = GlobalInfo & {
  readonly interaction: AutocompleteInteraction;
};

export type GuildChatCommandInfo = GlobalInfo & GuildInfo & { readonly response: ChatCommandResponse<'cached'> };
export type GuildAutocompleteInfo = GlobalInfo &
  GuildInfo & {
    readonly interaction: AutocompleteInteraction;
  };

type GlobalResponseFunction = (info: GlobalChatCommandInfo) => Promise<InteractionReplyOptions | void> | InteractionReplyOptions | void;
type GlobalAutocompleteFunction = (info: GlobalAutocompleteInfo) => Promise<ApplicationCommandOptionChoiceData[]> | ApplicationCommandOptionChoiceData[];

type GuildResponseFunction = (info: GuildChatCommandInfo) => Promise<InteractionReplyOptions | void> | InteractionReplyOptions | void;
type GuildAutocompleteFunction = (info: GuildAutocompleteInfo) => Promise<ApplicationCommandOptionChoiceData[]> | ApplicationCommandOptionChoiceData[];

export type ChatCommand<T extends 'Global' | 'Guild'> = (T extends 'Global'
  ? {
      readonly respond: GlobalResponseFunction;
      readonly autocomplete?: GlobalAutocompleteFunction;
      readonly type: T;
    }
  : {
      readonly respond: GuildResponseFunction;
      readonly autocomplete?: GuildAutocompleteFunction;
      readonly type: T;
    }) & {
  readonly data: ChatInputApplicationCommandData;
  readonly ephemeral?: boolean;
};

const guildInfo = new Map<string, GuildInfo>();
const commands = new Map<string, ChatCommand<'Global' | 'Guild'>>();
const databaseClient = new MongoClient(config.MONGODB_URL);

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

  for (const file of readdirSync('./dist/src/commands').filter((file) => file.endsWith('.js'))) {
    const { command } = (await import(`./commands/${file}`)) as { command: ChatCommand<'Global' | 'Guild'> };
    commands.set(command.data.name, command);
  }

  const announcementTask = cron.schedule(config.ANNOUNCEMENT_TIME, async (date) => {
    try {
      void ((await client.channels.fetch(config.ANNOUNCEMENT_CHANNEL)) as TextChannel).send(
        await getDailyReport(date, databaseClient.db(config.DATABASE_NAME)),
      );
    } catch (error) {
      logger.error(error, `Daily Announcement threw an error`);
      announcementTask.stop();
    }
  });

  const gradeTask = cron.schedule(config.GRADE_UPDATE_INTERVAL, async () => {
    try {
      const report = await gradeReport(config.IRC_AUTH, databaseClient.db(config.DATABASE_NAME), gradeTask);
      if (!report) return;
      void (await (await client.users.fetch(config.ADMIN)).createDM()).send({
        embeds: [report],
      });
    } catch (error) {
      logger.error(error, 'Grade Monitor threw an error');
      gradeTask.stop();
    }
  });

  client.on('interactionCreate', async (interaction) => {
    if (interaction.inCachedGuild() && !guildInfo.has(interaction.guildId)) {
      guildInfo.set(interaction.guildId, { queueManager: new QueueManager() });
    }

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

  logger.info(`\u001B[42m We have logged in as ${client.user!.tag} \u001B[0m`);
});

async function respondChatCommand(interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | void> {
  const command = commands.get(interaction.commandName)!;

  const interactionResponse = (await interaction.deferReply({ ephemeral: command.ephemeral })) as ChatCommandResponse<CacheType>;

  if (command.type === 'Guild') {
    if (!interaction.inCachedGuild()) {
      return responseOptions('error', {
        title: 'This is a server only command!',
      });
    }
    return command.respond({
      ...guildInfo.get(interaction.guildId)!,
      response: interactionResponse as ChatCommandResponse<'cached'>,
      database: databaseClient.db(config.DATABASE_NAME),
    });
  }

  return command.respond({
    response: interactionResponse,
    database: databaseClient.db(config.DATABASE_NAME),
  });
}

async function autocompleteChatCommand(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoiceData[]> {
  const command = commands.get(interaction.commandName)!;

  if (!command.autocomplete) {
    return [];
  }

  if (command.type === 'Guild') {
    if (!interaction.inCachedGuild()) return [];

    return command.autocomplete({
      ...guildInfo.get(interaction.guildId)!,
      interaction: interaction,
      database: databaseClient.db(config.DATABASE_NAME),
    });
  }

  return command.autocomplete({
    interaction: interaction,
    database: databaseClient.db(config.DATABASE_NAME),
  });
}

void client.login(config.TOKEN);
