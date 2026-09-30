import { describe, expect, it } from 'vitest';
import { chooseBlocks } from './ai';
import { resolveCombatDamage } from './combat';
import { findPayment } from './mana';
import { runScript, setupPuzzle, applyUserAction, scriptToAction, type PuzzleSpec } from './puzzle';

const unit = (uid: string, side: 'you' | 'opp', power: number, toughness: number, keywords: any[] = []) => ({ uid, side, power, toughness, damage: 0, keywords });

describe('combat math', () => {
  it('trades 2/2 for 2/2', () => {
    const r = resolveCombatDamage({ units: { a: unit('a', 'you', 2, 2), b: unit('b', 'opp', 2, 2) }, attackers: ['a'], blocks: { b: 'a' }, blocked: ['a'], defender: 'opp' });
    expect(r.dead.sort()).toEqual(['a', 'b']);
  });
  it('first strike kills before damage back', () => {
    const r = resolveCombatDamage({ units: { a: unit('a', 'you', 2, 2, ['firstStrike']), b: unit('b', 'opp', 2, 2) }, attackers: ['a'], blocks: { b: 'a' }, blocked: ['a'], defender: 'opp' });
    expect(r.dead).toEqual(['b']);
  });
  it('deathtouch kills a big blocker', () => {
    const r = resolveCombatDamage({ units: { a: unit('a', 'you', 1, 1, ['deathtouch']), b: unit('b', 'opp', 5, 5) }, attackers: ['a'], blocks: { b: 'a' }, blocked: ['a'], defender: 'opp' });
    expect(r.dead.sort()).toEqual(['a', 'b']);
  });
  it('trample carries excess damage', () => {
    const r = resolveCombatDamage({ units: { a: unit('a', 'you', 5, 5, ['trample']), b: unit('b', 'opp', 2, 2) }, attackers: ['a'], blocks: { b: 'a' }, blocked: ['a'], defender: 'opp' });
    expect(r.damageToPlayer.opp).toBe(3);
  });
  it('a blocked attacker whose blocker is gone deals no damage', () => {
    const r = resolveCombatDamage({ units: { a: unit('a', 'you', 3, 3) }, attackers: ['a'], blocks: {}, blocked: ['a'], defender: 'opp' });
    expect(r.damageToPlayer.opp).toBe(0);
  });
  it('lifelink gains life', () => {
    const r = resolveCombatDamage({ units: { a: unit('a', 'you', 2, 3, ['lifelink']) }, attackers: ['a'], blocks: {}, blocked: [], defender: 'opp' });
    expect(r.lifeGain.you).toBe(2);
  });
});

describe('mana', () => {
  it('taps basics before dual lands', () => {
    const s = setupPuzzle({ you: { battlefield: ['Swamp', 'Gloomwater Grotto', 'Swamp'] }, opp: {}, goal: { type: 'survive' } });
    const pay = findPayment(s, 'you', '{1}{B}')!;
    const tapped = pay.taps.map((t) => s.battlefield.find((p) => p.uid === t.uid)!.name);
    expect(tapped).toEqual(['Swamp', 'Swamp']);
  });
});

describe('puzzles', () => {
  it('burn to the face wins', () => {
    const spec: PuzzleSpec = { you: { battlefield: ['Mountain', 'Mountain'], hand: ['Lightning Lance'] }, opp: { life: 3 }, goal: { type: 'win' } };
    expect(runScript(spec, [{ do: 'cast', card: 'Lightning Lance', target: 'opp' }]).status).toBe('success');
  });

  it('opponent chump blocks to survive', () => {
    const spec: PuzzleSpec = {
      you: { battlefield: ['Grizzly Cub', 'Pack Wolf'] },
      opp: { life: 3, battlefield: ['Forward Cleric'] },
      goal: { type: 'win' },
    };
    const r = runScript(spec, [{ do: 'combat' }, { do: 'attack', with: ['Grizzly Cub', 'Pack Wolf'] }]);
    expect(r.status).toBe('fail');
    expect(r.state.players.opp.life).toBe(1);
  });

  it('pump after blocks wins combat', () => {
    const spec: PuzzleSpec = {
      you: { battlefield: ['Pack Wolf', 'Forest', 'Forest'], hand: ['Titanic Bloom'] },
      opp: { battlefield: ['Stalwart Irregulars'] },
      ai: { blocks: 'visible' },
      goal: { type: 'gone', card: 'Stalwart Irregulars' },
    };
    const r = runScript(spec, [
      { do: 'combat' },
      { do: 'attack', with: ['Pack Wolf'] },
      { do: 'cast', card: 'Titanic Bloom', target: 'you:Pack Wolf' },
      { do: 'pass' },
    ]);
    expect(r.state.events.died.map((d) => d.name)).toContain('Stalwart Irregulars');
    expect(r.status).toBe('success');
  });

  it('opponent kills the creature in response to a pump (2-for-1)', () => {
    const spec: PuzzleSpec = {
      you: { battlefield: ['Grizzly Cub', 'Forest', 'Forest'], hand: ['Titanic Bloom'] },
      opp: { battlefield: ['Crypt Shambler', 'Swamp', 'Swamp', 'Swamp'], hand: ['Hero\'s Ruin'] },
      ai: { blocks: [['Crypt Shambler', 'Grizzly Cub']] },
      goal: { type: 'alive', card: 'Grizzly Cub' },
    };
    const r = runScript(spec, [
      { do: 'combat' },
      { do: 'attack', with: ['Grizzly Cub'] },
      { do: 'cast', card: 'Titanic Bloom', target: 'you:Grizzly Cub' },
      { do: 'pass' },
    ]);
    expect(r.state.events.cast.map((c) => c.name)).toContain("Hero's Ruin");
    expect(r.status).toBe('fail');
  });

  it('counterspell AI counters the first spell', () => {
    const spec: PuzzleSpec = {
      you: { battlefield: ['Forest', 'Forest', 'Forest'], hand: ['Grizzly Cub'] },
      opp: { battlefield: ['Island', 'Island', 'Island'], hand: ['Dissolve Thought'] },
      ai: { counter: 'first' },
      goal: { type: 'alive', card: 'Grizzly Cub' },
    };
    const r = runScript(spec, [{ do: 'cast', card: 'Grizzly Cub' }]);
    expect(r.state.events.countered.length).toBe(1);
    expect(r.status).toBe('fail');
  });

  it('creature land animates and attacks', () => {
    const spec: PuzzleSpec = {
      you: { battlefield: ['Cascade Falls', 'Forest', 'Island', 'Forest', 'Island'] },
      opp: { life: 3 },
      goal: { type: 'win' },
    };
    const r = runScript(spec, [{ do: 'activate', card: 'Cascade Falls' }, { do: 'combat' }, { do: 'attack', with: ['Cascade Falls'] }]);
    expect(r.status).toBe('success');
  });

  it('opponent attacks with its best attack on its turn, you block', () => {
    const spec: PuzzleSpec = {
      start: 'oppAttack',
      you: { life: 4, battlefield: ['Web Weaver'] },
      opp: { battlefield: ['Sky Griffin', 'Grizzly Cub', 'Pack Wolf'] },
      goal: { type: 'survive' },
    };
    let s = setupPuzzle(spec);
    expect(s.step).toBe('blockers');
    expect(s.combat!.attackers.length).toBe(3);
    // Block the flyer — still take 4 from the ground and die (you have no instants, so damage happens).
    s = applyUserAction(spec, s, scriptToAction(s, { do: 'block', blocks: [['Web Weaver', 'Sky Griffin']] }));
    expect(s.winner).toBe('opp');
  });

  it('AI blocks the flyer with reach when it matters', () => {
    const spec: PuzzleSpec = {
      you: { battlefield: ['Sky Griffin'] },
      opp: { life: 2, battlefield: ['Web Weaver'] },
      goal: { type: 'win' },
    };
    let s = setupPuzzle(spec);
    s = applyUserAction(spec, s, { type: 'toCombat' });
    s = applyUserAction(spec, s, scriptToAction(s, { do: 'attack', with: ['Sky Griffin'] }));
    expect(s.step).toBe('combat');
    expect(Object.keys(s.combat!.blocks).length).toBe(1);
    void chooseBlocks;
  });
});
