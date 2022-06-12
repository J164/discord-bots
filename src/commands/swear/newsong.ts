import { ApplicationCommandOptionType, InteractionReplyOptions } from 'discord.js';
import { readdirSync } from 'node:fs';
import { ChatCommand, GlobalChatCommandInfo } from '../../bot-client.js';
import config from '../../config.json' assert { type: 'json' };
import { responseOptions } from '../../utils/builders.js';
import { logger } from '../../utils/logger.js';
import { download } from '../../voice/ytdl.js';

async function newSong(info: GlobalChatCommandInfo): Promise<InteractionReplyOptions> {
  if (info.response.interaction.user.id !== config.ADMIN && info.response.interaction.user.id !== config.SWEAR) {
    return responseOptions('error', {
      title: "You don't have permission to use this command!",
    });
  }
  if (!/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z\d-_&=?]+)$/.test(info.response.interaction.options.getString('url', true))) {
    return responseOptions('error', { title: 'Not a valid url!' });
  }
  void info.response.interaction.editReply(responseOptions('info', { title: 'Downloading...' }));
  const songs = readdirSync(`${config.DATA}/music_files/swear_songs/`);
  try {
    await download(info.response.interaction.options.getString('url', true), {
      outtmpl: `${config.DATA}/music_files/swear_songs/${songs.length + 1}.%(ext)s`,
      format: 'bestaudio[ext=webm][acodec=opus]',
    });
    return responseOptions('success', { title: 'Success!' });
  } catch (error) {
    logger.error(error, `Chat Command Interaction #${info.response.interaction.id}) threw an error when downloading`);
    return responseOptions('error', { title: 'Download Failed!' });
  }
}

export const command: ChatCommand<'Global'> = {
  data: {
    name: 'newsong',
    description: "Add a new song to Swear Bot's library",
    options: [
      {
        name: 'url',
        type: ApplicationCommandOptionType.String,
        description: 'The URL for the new swear song',
        required: true,
      },
    ],
  },
  respond: newSong,
  type: 'Global',
};
