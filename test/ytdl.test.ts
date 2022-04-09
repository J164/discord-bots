import { demuxProbe, StreamType } from '@discordjs/voice';
import { mkdirSync, rmSync } from 'node:fs';
import { download, resolve, createStream } from '../dist/util/ytdl.js';

beforeAll(() => {
  mkdirSync('temp');
});

afterAll(() => {
  rmSync('temp', { recursive: true });
});

test('ytdl resolve', async () => {
  expect(await resolve('https://youtu.be/hKRUPYrAQoE')).toEqual({
    webpage_url: 'https://www.youtube.com/watch?v=hKRUPYrAQoE',
    title: 'Two Steps From Hell - Victory',
    thumbnail: 'https://i.ytimg.com/vi_webp/hKRUPYrAQoE/maxresdefault.webp',
    duration: 329,
    success: true,
  });
});

test('ytdl valid download', async () => {
  await expect(
    download('https://youtu.be/8NGtL3HUPUo', {
      outtmpl: 'temp/%(title)s.%(ext)s',
      format: 'best[ext=mp4]',
    }),
  ).resolves.toBeUndefined();
});

test('ytdl invalid download', async () => {
  await expect(
    download('https://www.youtube.com/watch?v=u', {
      outtmpl: 'temp/%(title)s.%(ext)s',
      format: 'best[ext=mp4]',
    }),
  ).rejects.toBeDefined();
});

test('ytdl stream', async () => {
  const stream = createStream('https://youtu.be/uYWC0eqRFEM', { format: 'bestaudio[ext=webm][acodec=opus]' });
  expect((await demuxProbe(stream.stdout)).type).toBe(StreamType.WebmOpus);
  stream.kill();
});
