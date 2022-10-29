import {
  ApplicationCommandData,
  ApplicationCommandOptionChoiceData,
  AutocompleteInteraction,
  CacheType,
  ChatInputCommandInteraction,
  Client,
  ClientOptions,
  InteractionReplyOptions,
  InteractionResponse,
  InteractionType,
} from 'discord.js';
import { readdirSync } from 'node:fs';
import { responseOptions } from './utils/builders.js';
import { logger } from './utils/logger.js';
import { VoiceManager } from './voice/voice-manager.js';

interface GuildInfo {
  readonly voiceManager?: VoiceManager;
}

type ChatCommandResponse<T extends CacheType> = Omit<InteractionResponse, 'interaction'> & {
  interaction: ChatInputCommandInteraction<T>;
};

export type GlobalChatCommandInfo = {
  readonly response: ChatCommandResponse<CacheType>;
};
export type GlobalAutocompleteInfo = {
  readonly interaction: AutocompleteInteraction;
};

export type GuildChatCommandInfo = GuildInfo & { readonly response: ChatCommandResponse<'cached'> };
export type GuildAutocompleteInfo = GuildInfo & {
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
  readonly data: ApplicationCommandData;
  readonly ephemeral?: boolean;
};

export class BotClient extends Client {
  private readonly _commands: Map<string, ChatCommand<'Global' | 'Guild'>>;
  private readonly _guildInfo: Map<string, GuildInfo>;

  public constructor(options: ClientOptions, name: string) {
    super(options);

    this._commands = new Map<string, ChatCommand<'Global' | 'Guild'>>();
    this._guildInfo = new Map<string, GuildInfo>();

    this.once('ready', async () => {
      for (const file of readdirSync(`./dist/src/commands/${name}`).filter((file) => file.endsWith('.js'))) {
        const { command } = (await import(`./commands/${name}/${file}`)) as { command: ChatCommand<'Global' | 'Guild'> };
        this._commands.set(command.data.name, command);
      }

      this.on('interactionCreate', async (interaction) => {
        if (interaction.inCachedGuild() && !this._guildInfo.has(interaction.guildId)) {
          this._guildInfo.set(interaction.guildId, { voiceManager: new VoiceManager() });
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
      });
    }

    return command.respond({
      response: interactionResponse,
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
        interaction: interaction,
      });
    }

    return command.autocomplete({
      interaction: interaction,
    });
  }
}
