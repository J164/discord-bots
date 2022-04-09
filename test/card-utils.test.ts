import { buildEmbed } from '../dist/util/builders.js';
import { multicardMessage } from '../dist/util/card-utils.js';

test('multicardMessage with 1 card', () => {
  const { embed, file } = multicardMessage([{ code: 'back' }], 'info', { title: 'One Card' }, 'onecard');
  expect(embed).toEqual(buildEmbed('info', { title: 'One Card', image: { url: 'attachment://onecard.png' } }));
  expect(file.name).toBe('onecard.png');
});

test('multicardMessage with multiple cards', () => {
  const { embed, file } = multicardMessage(
    [{ code: '2S' }, { code: '0D' }, { code: '4D' }, { code: 'back' }, { code: 'AC' }, { code: '6H' }, { code: 'KD' }],
    'info',
    { title: '7 Cards' },
    'sevencards',
  );

  expect(embed).toEqual(buildEmbed('info', { title: '7 Cards', image: { url: 'attachment://sevencards.png' } }));
  expect(file.name).toBe('sevencards.png');
  expect(file.attachment).toBeDefined();

  expect(
    multicardMessage(
      [{ code: '2S' }, { code: '9C' }, { code: '4D' }, { code: '7H' }, { code: 'KD' }],
      'info',
      { title: '5 Cards' },
      'fivecards',
    ).file.attachment,
  ).toBeDefined();
});
