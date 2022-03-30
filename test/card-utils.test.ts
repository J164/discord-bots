import { readFileSync } from 'node:fs';
import { buildEmbed } from '../dist/util/builders.js';
import { multicardMessage } from '../dist/util/card-utils.js';

test('multicardMessage with 1 card', () => {
  expect(multicardMessage([{ code: 'back' }], 'info', { title: 'One Card' }, 'onecard')).toEqual({
    embed: buildEmbed('info', { title: 'One Card', image: { url: 'attachment://onecard.png' } }),
    file: { attachment: readFileSync('./assets/img/cards/back.png'), name: 'onecard.png' },
  });
});

test('multicardMessage with multiple cards', () => {
  expect(
    multicardMessage(
      [{ code: '2S' }, { code: '0D' }, { code: '4D' }, { code: 'back' }, { code: 'AC' }, { code: '6H' }, { code: 'KD' }],
      'info',
      { title: '7 Cards' },
      'sevencards',
    ),
  ).toEqual({
    embed: buildEmbed('info', { title: '7 Cards', image: { url: 'attachment://sevencards.png' } }),
    file: { attachment: readFileSync('./test/assets/multicardMessage7.png'), name: 'sevencards.png' },
  });

  expect(
    multicardMessage(
      [{ code: '2S' }, { code: '9C' }, { code: '4D' }, { code: '7H' }, { code: 'KD' }],
      'info',
      { title: '5 Cards' },
      'fivecards',
    ),
  ).toEqual({
    embed: buildEmbed('info', { title: '5 Cards', image: { url: 'attachment://fivecards.png' } }),
    file: { attachment: readFileSync('./test/assets/multicardMessage5.png'), name: 'fivecards.png' },
  });
});
