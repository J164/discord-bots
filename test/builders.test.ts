import { buildEmbed } from '../dist/util/builders.js';

test('buildEmbed info option', () => {
  expect(buildEmbed('info', { title: 'This is some info' })).toEqual({
    title: '\uD83D\uDCC4\tThis is some info',
    color: 0x00_99_ff,
  });

  expect(buildEmbed('info', { fields: [{ name: 'No title', value: 'sorry' }], color: 0x99_00_ff })).toEqual({
    title: '\uD83D\uDCC4\t',
    color: 0x99_00_ff,
    fields: [{ name: 'No title', value: 'sorry' }],
  });
});

test('buildEmbed error option', () => {
  expect(buildEmbed('error', { title: 'This is an error' })).toEqual({
    title: '\u274C\tThis is an error',
    color: 0xff_00_00,
  });

  expect(buildEmbed('error', { fields: [{ name: 'No title', value: 'sorry' }], color: 0x99_00_ff })).toEqual({
    title: '\u274C\t',
    color: 0x99_00_ff,
    fields: [{ name: 'No title', value: 'sorry' }],
  });
});

test('buildEmbed success option', () => {
  expect(buildEmbed('success', { title: 'This is a success!' })).toEqual({
    title: '\u2705\tThis is a success!',
    color: 0x00_ff_00,
  });

  expect(buildEmbed('success', { fields: [{ name: 'No title', value: 'sorry' }], color: 0x99_00_ff })).toEqual({
    title: '\u2705\t',
    color: 0x99_00_ff,
    fields: [{ name: 'No title', value: 'sorry' }],
  });
});

test('buildEmbed prompt option', () => {
  expect(buildEmbed('prompt', { title: 'This is a prompt' })).toEqual({
    title: '\u2753\tThis is a prompt',
    color: 0xff_a5_00,
  });

  expect(buildEmbed('prompt', { fields: [{ name: 'No title', value: 'sorry' }], color: 0x99_00_ff })).toEqual({
    title: '\u2753\t',
    color: 0x99_00_ff,
    fields: [{ name: 'No title', value: 'sorry' }],
  });
});
