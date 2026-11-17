import { describe, expect, it } from 'vitest';
import { segmentsAroundQuote } from './highlight';
import { MAX_CHARS, MIN_CHARS, sourceStatus } from './sourceText';
import {
  contractIssues,
  fromEditable,
  missingFields,
  toContract,
  toContractJson,
  toEditable,
} from './lessonContract';
import { DEFAULT_STATE, STORAGE_KEY, readStoredState, writeStoredState } from './storage';
import { reviewLesson } from '../services/reviewer';
import { SAMPLE_LESSON, SAMPLE_TEXT } from '../data/sample';

describe('sourceStatus (FR-1 length rule)', () => {
  it('accepts 50 and 3,000 characters and rejects 49 and 3,001', () => {
    expect(sourceStatus('a'.repeat(MIN_CHARS)).ok).toBe(true);
    expect(sourceStatus('a'.repeat(MAX_CHARS)).ok).toBe(true);
    expect(sourceStatus('a'.repeat(MIN_CHARS - 1)).ok).toBe(false);
    expect(sourceStatus('a'.repeat(MAX_CHARS + 1)).ok).toBe(false);
  });

  it('explains why text is too short or too long', () => {
    expect(sourceStatus('short').message).toBe('Add at least 50 characters. You have 5.');
    expect(sourceStatus('a'.repeat(3001)).message).toBe(
      'Shorten the text to 3,000 characters or fewer. You have 3,001.',
    );
  });

  it('does not count spaces at the ends', () => {
    expect(sourceStatus(`   ${'a'.repeat(10)}   `).count).toBe(10);
  });

  it('accepts the sample text', () => {
    expect(sourceStatus(SAMPLE_TEXT).ok).toBe(true);
  });
});

describe('segmentsAroundQuote (FR-6 highlight)', () => {
  it('marks the exact quote and keeps the rest of the source', () => {
    const { found, segments } = segmentsAroundQuote('One. Two three. Four.', 'Two three.');
    expect(found).toBe(true);
    expect(segments).toEqual([
      { text: 'One. ', marked: false },
      { text: 'Two three.', marked: true },
      { text: ' Four.', marked: false },
    ]);
  });

  it('reports not found and marks nothing when the quote is not an exact piece', () => {
    const { found, segments } = segmentsAroundQuote('One. Two.', 'Two or so.');
    expect(found).toBe(false);
    expect(segments).toEqual([{ text: 'One. Two.', marked: false }]);
  });

  it('treats an empty quote as not found', () => {
    expect(segmentsAroundQuote('One. Two.', '   ').found).toBe(false);
  });

  it('keeps markup-looking source text as plain text', () => {
    const { segments } = segmentsAroundQuote('<b>bold</b> text here.', '<b>bold</b>');
    expect(segments[0]).toEqual({ text: '<b>bold</b>', marked: true });
  });
});

describe('lesson contract helpers', () => {
  it('round-trips between the form shape and the contract shape', () => {
    expect(fromEditable(toEditable(SAMPLE_LESSON))).toEqual(SAMPLE_LESSON);
  });

  it('exports only contract keys, in contract order', () => {
    const withExtra = { ...SAMPLE_LESSON, extra: 'nope' };
    expect(Object.keys(toContract(withExtra))).toEqual(['title', 'summary', 'quiz', 'source_quote']);
    expect(JSON.parse(toContractJson(withExtra))).not.toHaveProperty('extra');
  });

  it('lists empty fields by label', () => {
    expect(missingFields({ title: 'x', summary: ' ', question: '', answer: '1', quote: 'q' })).toEqual([
      'Summary',
      'Quiz question',
    ]);
  });

  it('requires the blank in the quiz question', () => {
    expect(contractIssues({ ...SAMPLE_LESSON, quiz: { question: 'No blank here', answer: '15' } })).toEqual([
      'The quiz question needs one blank, written as ____.',
    ]);
  });
});

describe('reviewLesson stand-in (FR-3 plain-code checks)', () => {
  it('approves the sample lesson for the sample text', () => {
    expect(reviewLesson(SAMPLE_TEXT, SAMPLE_LESSON)).toEqual({ verdict: 'approve', issues: [] });
  });

  it('flags a quote that is not in the source and an answer that is not in the quote', () => {
    const bad = {
      ...SAMPLE_LESSON,
      source_quote: 'Hold it at noon, and keep it to 15 minutes.',
      quiz: { ...SAMPLE_LESSON.quiz, answer: '20' },
    };
    const result = reviewLesson(SAMPLE_TEXT, bad);
    expect(result.verdict).toBe('revise');
    expect(result.issues).toContain('The source quote is not an exact piece of the source text.');
    expect(result.issues).toContain('The quiz answer does not appear in the source quote.');
  });
});

describe('storage (FR-9)', () => {
  function memoryStorage(initial = {}) {
    const data = { ...initial };
    return {
      getItem: (k) => (k in data ? data[k] : null),
      setItem: (k, v) => {
        data[k] = String(v);
      },
    };
  }

  it('returns defaults when nothing is stored or storage is missing', () => {
    expect(readStoredState(memoryStorage())).toEqual(DEFAULT_STATE);
    expect(readStoredState(undefined)).toEqual(DEFAULT_STATE);
  });

  it('round-trips the state', () => {
    const storage = memoryStorage();
    const state = {
      ...DEFAULT_STATE,
      source: SAMPLE_TEXT,
      library: [{ lesson: SAMPLE_LESSON, approvedAt: 'now' }],
    };
    expect(writeStoredState(storage, state)).toBe(true);
    expect(readStoredState(storage)).toEqual(state);
  });

  it('drops corrupt entries instead of crashing', () => {
    const storage = memoryStorage({
      [STORAGE_KEY]: JSON.stringify({
        source: 42,
        library: [{ lesson: { title: 1 } }, { lesson: SAMPLE_LESSON, approvedAt: 'now' }],
        current: { id: 'x', lesson: 'nope' },
      }),
    });
    const state = readStoredState(storage);
    expect(state.source).toBe('');
    expect(state.current).toBeNull();
    expect(state.library).toHaveLength(1);
  });

  it('survives unparseable JSON and a throwing storage', () => {
    expect(readStoredState(memoryStorage({ [STORAGE_KEY]: '{not json' }))).toEqual(DEFAULT_STATE);
    const throwing = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('full');
      },
    };
    expect(readStoredState(throwing)).toEqual(DEFAULT_STATE);
    expect(writeStoredState(throwing, DEFAULT_STATE)).toBe(false);
  });
});
