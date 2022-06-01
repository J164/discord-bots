import { demuxProbe, StreamType } from '@discordjs/voice';
import test from 'ava';
import { mkdirSync, rmSync } from 'node:fs';
import { createStream, download, resolve } from '../src/voice/ytdl.js';

test.before(() => {
  mkdirSync('temp');
});

test.after(() => {
  rmSync('temp', { recursive: true });
});

test('ytdl resolve', async (t) => {
  t.deepEqual(await resolve('https://youtu.be/hKRUPYrAQoE'), {
    webpage_url: 'https://www.youtube.com/watch?v=hKRUPYrAQoE',
    title: 'Two Steps From Hell - Victory',
    thumbnail: 'https://i.ytimg.com/vi_webp/hKRUPYrAQoE/maxresdefault.webp',
    duration: 329,
  });
});

test('ytdl invalid resolve', async (t) => {
  await t.throwsAsync(resolve('https://www.youtube.com/watch?v=u'));
});

test('ytdl valid download', async (t) => {
  await t.notThrowsAsync(
    download('https://youtu.be/8NGtL3HUPUo', {
      outtmpl: 'temp/%(title)s.%(ext)s',
      format: 'best[ext=mp4]',
    }),
  );
});

test('ytdl invalid download', async (t) => {
  await t.throwsAsync(
    download('https://www.youtube.com/watch?v=u', {
      outtmpl: 'temp/%(title)s.%(ext)s',
      format: 'best[ext=mp4]',
    }),
  );
});

test('ytdl stream', async (t) => {
  const stream = createStream('https://youtu.be/uYWC0eqRFEM', { format: 'bestaudio[ext=webm][acodec=opus]' });
  t.deepEqual((await demuxProbe(stream.stdout)).type, StreamType.WebmOpus);
  stream.kill();
});
