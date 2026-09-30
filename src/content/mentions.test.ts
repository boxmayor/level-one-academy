import { describe, expect, it } from 'vitest';
import { getExercise } from './index';
import { cardMentions, unshownQuestionCards } from './mentions';

describe('card mentions', () => {
  it('finds full names, plurals and curly apostrophes', () => {
    expect(cardMentions('Cast Titan’s Surge on Grizzly Cub, then play two Forests.')).toEqual(["Titan's Surge", 'Grizzly Cub', 'Forest']);
  });

  it('matches short names only for cards in scope', () => {
    expect(cardMentions('Block the Cub.')).toEqual([]);
    expect(cardMentions('Block the Cub.', ['Grizzly Cub'])).toEqual(['Grizzly Cub']);
    expect(cardMentions('Your Shamblers stay back.', ['Crypt Shambler'])).toEqual(['Crypt Shambler']);
  });

  it('skips ambiguous and generic short names', () => {
    expect(cardMentions('The Rhino attacks.', ['Thornhide Rhino', 'Siegehorn Rhino'])).toEqual([]);
    expect(cardMentions('Make two Goblin tokens.', ['Ember Goblin'])).toEqual([]);
    expect(cardMentions('In Magic, you can respond.', ['Deny Magic'])).toEqual([]);
  });

  it('does not match inside longer words', () => {
    expect(cardMentions('Islandwalk and Forestry', [])).toEqual([]);
  });

  it('shows named cards that the question does not show otherwise', () => {
    // "Mind Rend" is named in the question, but no card row or board shows it.
    const ex = getExercise('card-advantage:1')!;
    expect(unshownQuestionCards(ex)).toEqual(['Mind Rend']);
  });
});
