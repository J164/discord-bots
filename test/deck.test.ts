import { Deck } from '../dist/util/deck.js';

test('Deck.randomCard()', () => {
  const set = new Set();
  for (const card of Deck.randomCard({ number: 60, noRepeats: true })) {
    if (!card) continue;
    set.add(card.code);
  }
  expect(set.size).toBe(52);

  expect(Deck.randomCard({}).length).toBe(1);
  expect(Deck.randomCard({})[0]).toBeTruthy();
});

test('instances of Deck', () => {
  expect(new Deck({ codes: ['2S', '3H', '5C', '0S'], values: [100, 3, 2, 1] }).shuffle().draw(4)).toEqual(
    expect.arrayContaining([
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
    ]),
  );
});
