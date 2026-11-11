import { describe, expect, it } from 'vitest';
import { campProgressLabel, climbFrom, type ClimbInput } from '@/lib/mbaLevels';

const input = (over: Partial<{ q: number; tests: number; onboarded: boolean; s: [number, number][] }> = {}): ClimbInput => {
  const s = over.s ?? [[0, 0], [0, 0], [0, 0]];
  return {
    onboarded: over.onboarded ?? true,
    totals: { questionsAttempted: over.q ?? 0, mocksCompleted: over.tests ?? 0 },
    sections: [
      { id: 'VARC', attempted: s[0][0], correct: s[0][1] },
      { id: 'DILR', attempted: s[1][0], correct: s[1][1] },
      { id: 'QA', attempted: s[2][0], correct: s[2][1] },
    ],
  };
};

describe('mbaLevels', () => {
  it('has seven camps in order', () => {
    const view = climbFrom(input());
    expect(view.camps.map((c) => c.id)).toEqual([
      'base', 'first-steps', 'diagnostic', 'ridge', 'strong-sections', 'high-camp', 'summit',
    ]);
    expect(view.camps.map((c) => c.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('starts at nothing before onboarding', () => {
    const view = climbFrom(input({ onboarded: false, q: 50, tests: 2 }));
    expect(view.current).toBeNull();
    expect(view.next?.id).toBe('base');
    expect(view.routeProgress).toBe(0);
    expect(view.states[0]).toBe('next');
  });

  it('puts a new, onboarded student at Base Camp with First Steps next', () => {
    const view = climbFrom(input());
    expect(view.current?.id).toBe('base');
    expect(view.next?.id).toBe('first-steps');
    expect(view.next?.checks[0].value).toBe('0/10 questions');
    expect(view.routeProgress).toBe(0);
  });

  it('reports partial progress toward the next camp', () => {
    const view = climbFrom(input({ q: 4 }));
    expect(view.next?.id).toBe('first-steps');
    expect(view.next?.progress).toBeCloseTo(0.4);
    expect(view.next?.checks[0].value).toBe('4/10 questions');
    expect(view.routeProgress).toBeCloseTo(0.4 / 6);
  });

  it('needs a submitted test for Diagnostic', () => {
    expect(climbFrom(input({ q: 38 })).next?.id).toBe('diagnostic');
    const view = climbFrom(input({ q: 38, tests: 1 }));
    expect(view.current?.id).toBe('diagnostic');
    expect(view.next?.checks[0].value).toBe('38/100 questions');
  });

  it('climbs in order — later camps do not count until earlier ones are reached', () => {
    // 3 tests but only 5 questions: High Camp is "reached" on its own rule, yet
    // the student stands at Base Camp because First Steps is not done.
    const view = climbFrom(input({ q: 5, tests: 3 }));
    expect(view.camps.find((c) => c.id === 'high-camp')?.reached).toBe(true);
    expect(view.current?.id).toBe('base');
    expect(view.states.slice(0, 3)).toEqual(['reached', 'next', 'ahead']);
  });

  it('Strong Sections needs every section at 50% over 20', () => {
    const almost = climbFrom(input({ q: 120, tests: 1, s: [[40, 25], [19, 15], [61, 40]] }));
    expect(almost.current?.id).toBe('ridge');
    expect(almost.next?.id).toBe('strong-sections');
    const dilr = almost.next!.checks.find((c) => c.key === 'strong-DILR')!;
    expect(dilr.met).toBe(false);
    expect(dilr.value).toBe('19/20 questions, 78%');

    const done = climbFrom(input({ q: 120, tests: 1, s: [[40, 20], [20, 10], [60, 40]] }));
    expect(done.current?.id).toBe('strong-sections');
    expect(done.next?.id).toBe('high-camp');
  });

  it('never rounds an unmet accuracy up to the threshold', () => {
    // 99/199 = 49.7% — must not pass, must not read "50%".
    const view = climbFrom(input({ q: 300, tests: 1, s: [[199, 99], [40, 30], [61, 40]] }));
    const varc = view.next!.checks.find((c) => c.key === 'strong-VARC')!;
    expect(varc.met).toBe(false);
    expect(varc.value).toBe('49% over 199 questions');
    expect(varc.progress).toBeLessThan(1);
  });

  it('High Camp needs 3 submitted tests', () => {
    const view = climbFrom(input({ q: 200, tests: 2, s: [[80, 50], [60, 33], [60, 40]] }));
    expect(view.current?.id).toBe('strong-sections');
    expect(view.next?.checks[0].value).toBe('2/3 tests');
  });

  it('Summit needs 60% over 50 in every section plus 3 tests', () => {
    const near = climbFrom(input({ q: 400, tests: 3, s: [[150, 100], [49, 40], [200, 130]] }));
    expect(near.current?.id).toBe('high-camp');
    expect(near.next?.id).toBe('summit');
    expect(near.next!.checks.filter((c) => c.met).map((c) => c.key)).toEqual([
      'summit-VARC', 'summit-QA', 'summit-tests-3',
    ]);

    const top = climbFrom(input({ q: 400, tests: 3, s: [[150, 90], [50, 30], [200, 130]] }));
    expect(top.current?.id).toBe('summit');
    expect(top.next).toBeNull();
    expect(top.routeProgress).toBe(1);
    expect(top.states.every((s) => s === 'reached')).toBe(true);
  });

  it('treats missing sections and bad numbers as zero', () => {
    const view = climbFrom({
      onboarded: true,
      totals: { questionsAttempted: Number.NaN, mocksCompleted: -2 },
      sections: [{ id: 'VARC', attempted: 10, correct: 30 }],
    });
    expect(view.current?.id).toBe('base');
    const strong = view.camps.find((c) => c.id === 'strong-sections')!;
    expect(strong.checks.find((c) => c.key === 'strong-QA')!.value).toBe('0/20 questions');
    // correct is capped at attempted.
    expect(strong.checks.find((c) => c.key === 'strong-VARC')!.value).toBe('10/20 questions, 100%');
  });

  it('caps count values at the target', () => {
    const view = climbFrom(input({ q: 966, tests: 6 }));
    expect(view.camps[3].checks[0].value).toBe('100/100 questions');
  });
});

describe('campProgressLabel', () => {
  it('uses a percentage for one-rule camps and rules met for the rest', () => {
    const mid = climbFrom(input({ q: 65, tests: 1 }));
    expect(campProgressLabel(mid.next!)).toBe('65%');
    const near = climbFrom(input({ q: 400, tests: 3, s: [[150, 100], [198, 113], [200, 130]] }));
    expect(near.next!.progress).toBeGreaterThan(0.95);
    expect(campProgressLabel(near.next!)).toBe('3 of 4 met');
    expect(campProgressLabel(near.camps[0])).toBe('Reached');
  });
});
