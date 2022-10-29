import test from 'ava';
import { mkdirSync, rmSync } from 'node:fs';
import { download } from '../src/voice/ytdl.js';

test.before(() => {
  mkdirSync('temp');
});

test.after(() => {
  rmSync('temp', { recursive: true });
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
