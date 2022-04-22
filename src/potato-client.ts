import {
  ApplicationCommandOptionChoice,
  AutocompleteInteraction,
  Client,
  ClientOptions,
  CommandInteraction,
  InteractionReplyOptions,
  TextChannel,
} from 'discord.js';
import { readdirSync, readFileSync } from 'node:fs';
import { buildEmbed } from './util/builders.js';
import { DatabaseManager } from './util/database-manager.js';
import { BaseChatCommand, GlobalChatCommand, GuildChatCommand, GuildInfo, PrivateData } from './util/interfaces.js';
import { QueueManager } from './voice/queue-manager.js';
import cron from 'node-cron';
import { env } from 'node:process';
import { getDailyReport } from './modules/daily-report.js';
import { gradeReport } from './modules/grade-report.js';

export class PotatoClient extends Client {
  private readonly _guildInfo: Map<string, GuildInfo>;
  private readonly _privateData: PrivateData;
  private readonly _commands: Map<string, BaseChatCommand>;
  private readonly _databaseManager: DatabaseManager;

  public constructor(clientOptions: ClientOptions) {
    super(clientOptions);

    this._guildInfo = new Map<string, GuildInfo>();
    this._privateData = JSON.parse(readFileSync('./assets/privateData.json', { encoding: 'utf8' })) as PrivateData;
    this._commands = new Map<string, BaseChatCommand>();
    this._databaseManager = new DatabaseManager();

    this.once('ready', async () => {
      await this._databaseManager.connect();
      for (const file of readdirSync('./dist/commands').filter((file) => file.endsWith('.js'))) {
        const { command } = (await import(`./commands/${file}`)) as { command: BaseChatCommand };
        this._commands.set(command.data.name, command);
      }

      cron.schedule(env.ANNOUNCEMENT_TIME, async () => {
        void ((await this.channels.fetch(env.ANNOUNCEMENT_CHANNEL)) as TextChannel).send(
          await getDailyReport(new Date(), this._databaseManager),
        );
      });

      cron.schedule(env.GRADE_UPDATE_INTERVAL, async () => {
        for (const user of Object.keys(this._privateData.ircAuth)) {
          const report = await gradeReport(this._privateData.ircAuth[user], this._databaseManager);
          if (!report) return;
          void (await (await this.users.fetch(user)).createDM()).send({
            embeds: [report],
          });
        }
      });

      this.on('interactionCreate', async (interaction) => {
        if (interaction.inGuild() && !this._guildInfo.has(interaction.guildId)) {
          this._guildInfo.set(interaction.guildId, { queueManager: new QueueManager() });
        }

        if (interaction.isAutocomplete()) {
          void interaction
            .respond(
              await this.autocompleteChatCommand(interaction).catch((error) => {
                console.error(error);
                return [];
              }),
            )
            .catch();
          return;
        }

        if (!interaction.isCommand()) return;

        void interaction
          .editReply(
            (await this.respondChatCommand(interaction).catch((error) => {
              console.error(error);
              return {
                embeds: [buildEmbed('error', { title: 'Something went wrong!' })],
              };
            })) ?? {},
          )
          .catch();
      });

      this.user.setStatus('online');
      console.log(`\u001B[42m We have logged in as ${this.user.tag} \u001B[0m`);
    });
  }

  private async respondChatCommand(interaction: CommandInteraction): Promise<InteractionReplyOptions> {
    const command = this._commands.get(interaction.commandName);

    await interaction.deferReply({ ephemeral: command.ephemeral });

    if (command.type === 'Guild') {
      if (!interaction.inGuild()) {
        return {
          embeds: [
            buildEmbed('error', {
              title: 'Please only use this command in servers!',
            }),
          ],
        };
      }
      return (command as GuildChatCommand).respond({
        ...this._guildInfo.get(interaction.guildId),
        interaction: interaction,
        database: this._databaseManager,
        privateData: this._privateData,
      });
    }

    return (command as GlobalChatCommand).respond({
      interaction: interaction,
      database: this._databaseManager,
      privateData: this._privateData,
    });
  }

  private async autocompleteChatCommand(interaction: AutocompleteInteraction): Promise<ApplicationCommandOptionChoice[]> {
    const command = this._commands.get(interaction.commandName);

    if (command.type === 'Guild') {
      if (!interaction.inGuild()) return [];

      return (
        (await (command as GuildChatCommand).autocomplete({
          ...this._guildInfo.get(interaction.guildId),
          option: interaction.options.getFocused(true),
          database: this._databaseManager,
          privateData: this._privateData,
        })) ?? []
      );
    }

    return (
      (await (command as GlobalChatCommand).autocomplete({
        option: interaction.options.getFocused(true),
        database: this._databaseManager,
        privateData: this._privateData,
      })) ?? []
    );
  }
}
