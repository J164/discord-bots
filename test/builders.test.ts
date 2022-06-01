import test from 'ava';
import { responseEmbed, responseOptions } from '../src/util/builders.js';

test('responseEmbed info option', (t) => {
  t.deepEqual(responseEmbed('info', { title: 'This is some info' }), {
    title: '\uD83D\uDCC4\tThis is some info',
    color: 0x00_99_ff,
  });

  t.deepEqual(responseEmbed('info', { fields: [{ name: 'No title', value: 'sorry' }], color: 0x99_00_ff }), {
    title: '\uD83D\uDCC4\t',
    color: 0x99_00_ff,
    fields: [{ name: 'No title', value: 'sorry' }],
  });
});

test('responseEmbed error option', (t) => {
  t.deepEqual(responseEmbed('error', { title: 'This is an error' }), {
    title: '\u274C\tThis is an error',
    color: 0xff_00_00,
  });

  t.deepEqual(responseEmbed('error', { fields: [{ name: 'No title', value: 'sorry' }], color: 0x99_00_ff }), {
    title: '\u274C\t',
    color: 0x99_00_ff,
    fields: [{ name: 'No title', value: 'sorry' }],
  });
});

test('responseEmbed success option', (t) => {
  t.deepEqual(responseEmbed('success', { title: 'This is a success!' }), {
    title: '\u2705\tThis is a success!',
    color: 0x00_ff_00,
  });

  t.deepEqual(responseEmbed('success', { fields: [{ name: 'No title', value: 'sorry' }], color: 0x99_00_ff }), {
    title: '\u2705\t',
    color: 0x99_00_ff,
    fields: [{ name: 'No title', value: 'sorry' }],
  });
});

test('responseEmbed prompt option', (t) => {
  t.deepEqual(responseEmbed('prompt', { title: 'This is a prompt' }), {
    title: '\u2753\tThis is a prompt',
    color: 0xff_a5_00,
  });

  t.deepEqual(responseEmbed('prompt', { fields: [{ name: 'No title', value: 'sorry' }], color: 0x99_00_ff }), {
    title: '\u2753\t',
    color: 0x99_00_ff,
    fields: [{ name: 'No title', value: 'sorry' }],
  });
});

test('responseOptions', (t) => {
  t.deepEqual(responseOptions('error', { title: 'This is a reply options object' }), {
    embeds: [
      {
        title: '\u274C\tThis is a reply options object',
        color: 0xff_00_00,
      },
    ],
  });
});
