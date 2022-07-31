import { InteractionReplyOptions, TextChannel } from 'discord.js';
import config from '../config.json' assert { type: 'json' };
import { ChatCommand, GlobalChatCommandInfo } from '../index.js';
import { getDailyReport } from '../modules/daily-report.js';
import { partialISOString } from '../modules/weather-report.js';
import { responseOptions } from '../util/builders.js';

async function dailyReport(info: GlobalChatCommandInfo): Promise<InteractionReplyOptions> {
  if (info.response.interaction.user.id !== config.ADMIN) {
    return responseOptions('error', { title: "You don't have permission to use this command!" });
  }

  const date = new Date();
  void ((await info.response.client.channels.fetch(config.ANNOUNCEMENT_CHANNEL)) as TextChannel).send(
    await getDailyReport(date, info.weather.get(partialISOString(date))!, info.database),
  );
  return responseOptions('success', { title: 'Success!' });
}

export const command: ChatCommand<'Global'> = {
  data: {
    name: 'daily-report',
    description: 'Send the daily report to the announcement channel',
  },
  respond: dailyReport,
  type: 'Global',
};
