import { MessageEmbedOptions } from 'discord.js';

export function buildEmbed(type: 'info' | 'error' | 'success' | 'prompt', options: MessageEmbedOptions): MessageEmbedOptions {
  switch (type) {
    case 'info':
      options.color ??= 0x00_99_ff;
      options.title = `\uD83D\uDCC4\t${options.title ?? ''}`;
      break;
    case 'error':
      options.color ??= 0xff_00_00;
      options.title = `\u274C\t${options.title ?? ''}`;
      break;
    case 'success':
      options.color ??= 0x00_ff_00;
      options.title = `\u2705\t${options.title ?? ''}`;
      break;
    case 'prompt':
      options.color ??= 0xff_a5_00;
      options.title = `\u2753\t${options.title ?? ''}`;
      break;
  }
  return options;
}
