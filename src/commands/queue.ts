import { ButtonInteraction, InteractionUpdateOptions } from 'discord.js';
import { buildEmbed } from '../util/builders.js';
import { GuildChatCommandInfo, GuildChatCommand } from '../util/interfaces.js';
import { QueueItem } from '../voice/queue-manager.js';

async function queue(info: GuildChatCommandInfo, queueArray?: QueueItem[][], button?: ButtonInteraction, page = 0): Promise<undefined> {
  if (!queueArray) {
    queueArray = await info.queueManager.getPaginatedQueue();
    if (!queueArray) {
      void info.interaction.editReply({
        embeds: [buildEmbed('error', { title: 'There is no queue!' })],
      });
      return;
    }
  }
  const title = info.queueManager.queueLoop ? 'Queue (Looping)' : 'Queue';
  const queueMessage = buildEmbed('info', {
    title: title,
    footer: { text: `${page + 1}/${queueArray.length}` },
    fields: [],
  });
  for (const [index, entry] of queueArray[page].entries()) {
    queueMessage.fields.push({
      name: index === 0 && page === 0 ? 'Currently Playing:' : `${index + page * 25}.`,
      value: `${entry.title} (${entry.duration})\n${entry.url}`,
    });
  }
  const options: InteractionUpdateOptions = {
    embeds: [queueMessage],
    components: [
      {
        type: 'ACTION_ROW',
        components: [
          {
            type: 'BUTTON',
            customId: 'queue-doublearrowleft',
            emoji: '\u23EA',
            label: 'Return to Beginning',
            style: 'SECONDARY',
            disabled: page === 0,
          },
          {
            type: 'BUTTON',
            customId: 'queue-arrowleft',
            emoji: '\u2B05\uFE0F',
            label: 'Previous Page',
            style: 'SECONDARY',
            disabled: page === 0,
          },
          {
            type: 'BUTTON',
            customId: 'queue-arrowright',
            emoji: '\u27A1\uFE0F',
            label: 'Next Page',
            style: 'SECONDARY',
            disabled: page === queueArray.length - 1,
          },
          {
            type: 'BUTTON',
            customId: 'queue-doublearrowright',
            emoji: '\u23E9',
            label: 'Jump to End',
            style: 'SECONDARY',
            disabled: page === queueArray.length - 1,
          },
        ],
      },
    ],
  };
  await (!button ? info.interaction.editReply(options) : button.update(options));
  info.interaction.channel
    .createMessageComponentCollector({
      filter: (b) => b.user.id === info.interaction.user.id && b.customId.startsWith(info.interaction.commandName),
      time: 300_000,
      componentType: 'BUTTON',
      max: 1,
    })
    .once('end', async (b) => {
      await info.interaction.editReply({ components: [] }).catch();
      if (!b.at(0)) return;
      switch (b.at(0).customId) {
        case 'queue-doublearrowleft':
          void queue(info, queueArray, b.at(0));
          break;
        case 'queue-arrowleft':
          void queue(info, queueArray, b.at(0), page - 1);
          break;
        case 'queue-arrowright':
          void queue(info, queueArray, b.at(0), page + 1);
          break;
        case 'queue-doublearrowright':
          void queue(info, queueArray, b.at(0), queueArray.length - 1);
          break;
      }
    });
  return undefined;
}

export const command: GuildChatCommand = {
  data: {
    name: 'queue',
    description: 'Get the song queue',
  },
  respond: queue,
  ephemeral: true,
  type: 'Guild',
};
