import {
  editDistance,
  isPassingVerdict,
  normalizeUtterance,
  phoneticKey,
  scoreUtterance,
} from '@/domain/learning/pronunciation';

describe('normalizeUtterance', () => {
  it('lowercases, strips accents and punctuation, and spells out digits', () => {
    expect(normalizeUtterance('  Piñata!! ')).toBe('pinata');
    expect(normalizeUtterance('I am 7.')).toBe('i am seven');
    expect(normalizeUtterance("Don't")).toBe('don t');
  });
});

describe('phoneticKey', () => {
  it('folds common Spanish/Portuguese speaker sound swaps', () => {
    expect(phoneticKey('three')).toBe(phoneticKey('tree'));
    expect(phoneticKey('very')).toBe(phoneticKey('berry'));
    expect(phoneticKey('phone')).toBe(phoneticKey('fone'));
    expect(phoneticKey('knife')).toBe(phoneticKey('nife'));
  });
});

describe('editDistance', () => {
  it('counts insertions, deletions and substitutions', () => {
    expect(editDistance('dog', 'dog')).toBe(0);
    expect(editDistance('dog', 'dok')).toBe(1);
    expect(editDistance('', 'cat')).toBe(3);
  });
});

describe('scoreUtterance (words)', () => {
  it.each([
    ['dog', ['dog'], 'great'],
    ['dog', ['a dog'], 'great'],
    ['seven', ['7'], 'great'],
    ['bee', ['be'], 'great'],
    ['three', ['tree'], 'great'],
    ['dog', ['dock'], 'good'],
    ['elephant', ['elefant'], 'great'],
    ['rabbit', ['rabid'], 'good'],
    ['dog', ['banana'], 'try-again'],
    ['dog', [''], 'try-again'],
    ['dog', [], 'try-again'],
  ] as const)('target %s heard %j → %s', (target, heard, verdict) => {
    expect(scoreUtterance(target, heard).verdict).toBe(verdict);
  });

  it('keeps the best alternative and reports what was heard', () => {
    const result = scoreUtterance('cat', ['hat', 'cat', 'cut']);
    expect(result.verdict).toBe('great');
    expect(result.heard).toBe('cat');
  });
});

describe('scoreUtterance (sentences)', () => {
  it('scores by the share of words heard', () => {
    expect(scoreUtterance('I like red.', ['I like red']).verdict).toBe('great');
    expect(scoreUtterance('The dog is happy.', ['the dog is hoppy']).verdict).toBe('good');
    expect(scoreUtterance('The dog is happy.', ['banana']).verdict).toBe('try-again');
  });
});

describe('isPassingVerdict', () => {
  it('treats self-check and good as passing', () => {
    expect(isPassingVerdict('great')).toBe(true);
    expect(isPassingVerdict('good')).toBe(true);
    expect(isPassingVerdict('self-check')).toBe(true);
    expect(isPassingVerdict('try-again')).toBe(false);
  });
});

describe('accents of French-speaking learners (v1.3)', () => {
  it.each([
    ['happy', 'appy', 'great'], // h-dropping
    ['hello', 'ello', 'great'],
    ['house', 'ouse', 'great'],
    ['this', 'zis', 'good'], // th → z
    ['three', 'tree', 'great'], // th → t
    ['three', 'free', 'good'], // th → f
    ['sheep', 'ship', 'great'], // long and short i merge
  ] as const)('%s heard as "%s" is %s', (target, heard, verdict) => {
    expect(scoreUtterance(target, [heard]).verdict).toBe(verdict);
  });

  it('still rejects a different word', () => {
    expect(scoreUtterance('happy', ['banana']).verdict).toBe('try-again');
    expect(scoreUtterance('three', ['house']).verdict).toBe('try-again');
  });
});
