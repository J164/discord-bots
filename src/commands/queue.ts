import { ButtonStyle, ComponentType, InteractionReplyOptions, InteractionUpdateOptions } from 'discord.js';
import { ChatCommand, GuildChatCommandInfo } from '../index.js';
import { Emojis, responseEmbed, responseOptions } from '../util/builders.js';
import { QueueItem } from '../voice/queue-manager.js';

function response(info: GuildChatCommandInfo, queueArray: QueueItem[][], page: number): InteractionUpdateOptions & InteractionReplyOptions {
  void prompt(info, queueArray, page);
  return {
    embeds: [
      responseEmbed('info', {
        title: info.queueManager.queueLoop ? 'Queue (Looping)' : 'Queue',
        footer: { text: `${page + 1}/${queueArray.length}` },
        fields: queueArray[page].map((entry, index) => {
          return {
            name: index === 0 && page === 0 ? 'Currently Playing:' : `${index + page * 25}.`,
            value: `${entry.title} (${entry.duration})\n${entry.url}`,
          };
        }),
      }),
    ],
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.Button,
            customId: 'jumpleft',
            emoji: Emojis.DoubleArrowLeft,
            label: 'Return to Beginning',
            style: ButtonStyle.Secondary,
            disabled: page === 0,
          },
          {
            type: ComponentType.Button,
            customId: 'left',
            emoji: Emojis.ArrowLeft,
            label: 'Previous Page',
            style: ButtonStyle.Secondary,
            disabled: page === 0,
          },
          {
            type: ComponentType.Button,
            customId: 'right',
            emoji: Emojis.ArrowRight,
            label: 'Next Page',
            style: ButtonStyle.Secondary,
            disabled: page === queueArray.length - 1,
          },
          {
            type: ComponentType.Button,
            customId: 'jumpright',
            emoji: Emojis.DoubleArrowRight,
            label: 'Jump to End',
            style: ButtonStyle.Secondary,
            disabled: page === queueArray.length - 1,
          },
        ],
      },
    ],
  };
}

async function prompt(info: GuildChatCommandInfo, queueArray: QueueItem[][], page: number) {
  let component;
  try {
    component = await info.response.awaitMessageComponent({
      filter: (b) => b.user.id === info.response.interaction.user.id,
      time: 300_000,
      componentType: ComponentType.Button,
    });
  } catch {
    void info.response.interaction.editReply({ components: [] }).catch();
    return;
  }

  switch (component.customId) {
    case 'jumpleft':
      void component.update(response(info, queueArray, 0));
      break;
    case 'left':
      void component.update(response(info, queueArray, page - 1));
      break;
    case 'right':
      void component.update(response(info, queueArray, page + 1));
      break;
    case 'jumpright':
      void component.update(response(info, queueArray, queueArray.length - 1));
      break;
  }
}

async function queue(info: GuildChatCommandInfo): Promise<void> {
  const queueArray = await info.queueManager.getPaginatedQueue();
  if (!queueArray) {
    void info.response.interaction.editReply(responseOptions('error', { title: 'There is no queue!' }));
    return;
  }
  void info.response.interaction.editReply(response(info, queueArray, 0));
}

export const command: ChatCommand<'Guild'> = {
  data: {
    name: 'queue',
    description: 'Get the song queue',
  },
  respond: queue,
  ephemeral: true,
  type: 'Guild',
};
