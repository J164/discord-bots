import { ApplicationCommandData, InteractionReplyOptions, ApplicationCommandOptionChoice, CommandInteraction } from 'discord.js';
import { QueueManager } from '../voice/queue-manager.js';
import { DatabaseManager } from './database-manager.js';

export interface GuildInfo {
  readonly queueManager: QueueManager;
}

export interface PrivateData {
  readonly ircAuth: {
    [id: string]: {
      readonly token: string;
      readonly id: string;
      readonly cid: string;
      readonly tid: string;
    };
  };
}

interface GlobalInfo {
  readonly database: DatabaseManager;
  readonly privateData: PrivateData;
}

export type GlobalChatCommandInfo = GlobalInfo & {
  readonly interaction: CommandInteraction;
};
export type GlobalAutocompleteInfo = GlobalInfo & {
  readonly option: ApplicationCommandOptionChoice;
};

export type GuildChatCommandInfo = GuildInfo & GlobalChatCommandInfo;
export type GuildAutocompleteInfo = GuildInfo & GlobalAutocompleteInfo;

export interface BaseChatCommand {
  readonly data: ApplicationCommandData;
  readonly ephemeral?: boolean;

  readonly type: 'Global' | 'Guild';
}

type GlobalResponseFunction = (info: GlobalChatCommandInfo) => Promise<InteractionReplyOptions> | InteractionReplyOptions;
type GlobalAutocompleteFunction = (
  info: GlobalAutocompleteInfo,
) => Promise<ApplicationCommandOptionChoice[]> | ApplicationCommandOptionChoice[];

export interface GlobalChatCommand extends BaseChatCommand {
  readonly respond: GlobalResponseFunction;
  readonly autocomplete?: GlobalAutocompleteFunction;

  readonly type: 'Global';
}

type GuildResponseFunction = (info: GuildChatCommandInfo) => Promise<InteractionReplyOptions> | InteractionReplyOptions;
type GuildAutocompleteFunction = (
  info: GuildAutocompleteInfo,
) => Promise<ApplicationCommandOptionChoice[]> | ApplicationCommandOptionChoice[];

export interface GuildChatCommand extends BaseChatCommand {
  readonly respond: GuildResponseFunction;
  readonly autocomplete?: GuildAutocompleteFunction;

  readonly type: 'Guild';
}
