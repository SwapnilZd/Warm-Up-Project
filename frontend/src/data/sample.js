// The sample text from the prototype (03-Prototype), and the lesson the stub agent returns for it.
export const SAMPLE_TEXT =
  'A good team stand-up is short and predictable. Hold it at the same time every day, and keep it to 15 minutes. Each person answers three questions: what they did yesterday, what they will do today, and what is blocking them. Detailed discussions are parked and taken offline with the people involved. Every blocker is written down with an owner.';

export const SAMPLE_LESSON = Object.freeze({
  title: 'Running a stand-up',
  summary: 'A good team stand-up is short and predictable.',
  quiz: {
    question: 'Hold the stand-up at the same time every day and keep it to ____ minutes.',
    answer: '15',
  },
  source_quote: 'Hold it at the same time every day, and keep it to 15 minutes.',
});
