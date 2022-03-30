import { InteractionReplyOptions } from 'discord.js';
import { env } from 'node:process';
import { buildEmbed } from '../util/builders.js';
import { GlobalChatCommandInfo, GlobalChatCommand } from '../util/interfaces.js';
import { download } from '../util/ytdl.js';

function downloadVideo(info: GlobalChatCommandInfo): InteractionReplyOptions {
  if (
    !/^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([A-Za-z\d-_&=?]+)$/.test(
      info.interaction.options.getString('url'),
    )
  ) {
    return { embeds: [buildEmbed('error', { title: 'Not a valid url!' })] };
  }
  void info.interaction.editReply({
    embeds: [buildEmbed('info', { title: 'Downloading...' })],
  });
  download(info.interaction.options.getString('url'), {
    outtmpl: `${env.DOWNLOAD_DIR}/%(title)s.%(ext)s`,
    format: info.interaction.options.getBoolean('dev') ? 'bestaudio[ext=webm][acodec=opus]/bestaudio' : 'best',
  }).then(
    () => {
      void info.interaction
        .editReply({
          embeds: [buildEmbed('success', { title: 'Download Successful!' })],
        })
        .catch();
    },
    (error) => {
      console.error(error);
      void info.interaction
        .editReply({
          embeds: [buildEmbed('error', { title: 'Download Failed!' })],
        })
        .catch();
    },
  );
}

export const command: GlobalChatCommand = {
  data: {
    name: 'download',
    description: 'Download a video off of Youtube',
    options: [
      {
        name: 'url',
        description: 'The url of the video you want to download',
        type: 3,
        required: true,
      },
      {
        name: 'dev',
        description: 'Download the opus encoded webm file for this song',
        type: 5,
        required: false,
      },
    ],
  },
  respond: downloadVideo,
  type: 'Global',
};
