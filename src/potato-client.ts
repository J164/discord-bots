import {
  ApplicationCommandOptionChoiceData,
  AutocompleteInteraction,
  CacheType,
  ChatInputApplicationCommandData,
  ChatInputCommandInteraction,
  Client,
  ClientOptions,
  InteractionReplyOptions,
  InteractionResponse,
  InteractionType,
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
  readonly option: ApplicationCommandOptionChoiceData;
};

export type GuildChatCommandInfo = GlobalInfo & GuildInfo & { readonly response: ChatCommandResponse<'cached'> };
export type GuildAutocompleteInfo = GlobalInfo &
  GuildInfo & {
    readonly option: ApplicationCommandOptionChoiceData;
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

export class PotatoClient extends Client {
  private readonly _guildInfo: Map<string, GuildInfo>;
  private readonly _commands: Map<string, ChatCommand<'Global' | 'Guild'>>;
  private readonly _databaseClient: MongoClient;

  public constructor(clientOptions: ClientOptions) {
    super(clientOptions);

    this._guildInfo = new Map<string, GuildInfo>();
    this._commands = new Map<string, ChatCommand<'Global' | 'Guild'>>();
    this._databaseClient = new MongoClient(config.MONGODB_URL);

    this.once('ready', async () => {
      await this._databaseClient.connect();

      for (const file of readdirSync('./dist/src/commands').filter((file) => file.endsWith('.js'))) {
        const { command } = (await import(`./commands/${file}`)) as { command: ChatCommand<'Global' | 'Guild'> };
        this._commands.set(command.data.name, command);
      }

      const announcementTask = cron.schedule(config.ANNOUNCEMENT_TIME, async (date) => {
        try {
          void ((await this.channels.fetch(config.ANNOUNCEMENT_CHANNEL)) as TextChannel).send(
            await getDailyReport(date, this._databaseClient.db(config.DATABASE_NAME)),
          );
        } catch (error) {
          logger.error(error, `Daily Announcement threw an error`);
          announcementTask.stop();
        }
      });

      const gradeTask = cron.schedule(config.GRADE_UPDATE_INTERVAL, async () => {
        try {
          const report = await gradeReport(config.IRC_AUTH, this._databaseClient.db(config.DATABASE_NAME), gradeTask);
          if (!report) return;
          void (await (await this.users.fetch(config.ADMIN)).createDM()).send({
            embeds: [report],
          });
        } catch (error) {
          logger.error(error, 'Grade Monitor threw an error');
          gradeTask.stop();
        }
      });

      this.on('interactionCreate', async (interaction) => {
        if (interaction.inCachedGuild() && !this._guildInfo.has(interaction.guildId)) {
          this._guildInfo.set(interaction.guildId, { queueManager: new QueueManager() });
        }

        if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
          let response: ApplicationCommandOptionChoiceData[];
          try {
            response = await this._autocompleteChatCommand(interaction);
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
          response = await this._respondChatCommand(interaction);
        } catch (error) {
          logger.error(error, `Chat Command Interaction #${interaction.id} threw an error`);
          response = responseOptions('error', { title: 'Something went wrong!' });
        }

        if (response) {
          void interaction.editReply(response).catch();
        }
      });

      logger.info(`\u001B[42m We have logged in as ${this.user!.tag} \u001B[0m`);
    });
  }

  private async _respondChatCommand(interaction: ChatInputCommandInteraction): Promise<InteractionReplyOptions | void> {
    const command = this._commands.get(interaction.commandName)!;

    const interactionResponse = (await interaction.deferReply({ ephemeral: command.ephemeral })) as ChatCommandResponse<CacheType>;

    if (command.type === 'Guild') {
      if (!interaction.inCachedGuild()) {
        return responseOptions('error', {
          title: 'This is a server only command!',
        });
      }
      return command.respond({
        ...this._guildInfo.get(interaction.guildId)!,
        response: interactionResponse as ChatCommandResponse<'cached'>,
        database: this._databaseClient.db(config.DATABASE_NAME),
      });
    }

    return command.respond({
      response: interactionResponse,
      database: this._databaseClient.db(config.DATABASE_NAME),
    });
  }

  private async _autocompleteChatCommand(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoiceData[]> {
    const command = this._commands.get(interaction.commandName)!;

    if (!command.autocomplete) {
      return [];
    }

    if (command.type === 'Guild') {
      if (!interaction.inCachedGuild()) return [];

      return command.autocomplete({
        ...this._guildInfo.get(interaction.guildId)!,
        option: interaction.options.getFocused(true),
        database: this._databaseClient.db(config.DATABASE_NAME),
      });
    }

    return command.autocomplete({
      option: interaction.options.getFocused(true),
      database: this._databaseClient.db(config.DATABASE_NAME),
    });
  }
}
