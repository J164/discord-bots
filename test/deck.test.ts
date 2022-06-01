import test from 'ava';
import { Deck } from '../src/util/deck.js';

test('Deck.randomCard()', (t) => {
  const set = new Set();
  for (const card of Deck.randomCard({ number: 60, noRepeats: true })) {
    if (!card) continue;
    set.add(card.code);
  }
  t.is(set.size, 52);

  t.is(Deck.randomCard({}).length, 1);
  t.truthy(Deck.randomCard({})[0]);
});

test('instances of Deck', (t) => {
  t.notThrows(() => {
    new Deck({}).shuffle();
  });
  t.deepEqual(new Deck({ codes: ['2S', '3H', '5C', '0S'], values: [100, 3, 2, 1] }).draw(4), [
    {
      code: '2S',
      suit: 'Spades',
      value: 100,
      name: 'two',
      image: 'https://deckofcardsapi.com/static/img/2S.png',
    },
    {
      code: '3H',
      suit: 'Hearts',
      value: 3,
      name: 'three',
      image: 'https://deckofcardsapi.com/static/img/3H.png',
    },
    {
      code: '5C',
      suit: 'Clubs',
      value: 1,
      name: 'five',
      image: 'https://deckofcardsapi.com/static/img/5C.png',
    },
    {
      code: '0S',
      suit: 'Spades',
      value: 10,
      name: 'ten',
      image: 'https://deckofcardsapi.com/static/img/0S.png',
    },
  ]);
});

test('Invalid card code', (t) => {
  t.throws(() => {
    // @ts-expect-error
    new Deck({ codes: ['1S'] });
  });
  t.throws(() => {
    // @ts-expect-error
    new Deck({ codes: ['2J'] });
  });
});
