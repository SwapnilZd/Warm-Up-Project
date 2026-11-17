// The lesson contract agreed in the PRD. The Drafter returns this shape and the
// review screen reads it. Keep the key order: it is the order used in exported JSON.

export const EMPTY_LESSON = Object.freeze({
  title: '',
  summary: '',
  quiz: { question: '', answer: '' },
  source_quote: '',
});

/** Turn a contract lesson into the flat shape the form edits. */
export function toEditable(lesson) {
  return {
    title: lesson.title ?? '',
    summary: lesson.summary ?? '',
    question: lesson.quiz?.question ?? '',
    answer: lesson.quiz?.answer ?? '',
    quote: lesson.source_quote ?? '',
  };
}

/** Turn the flat form values back into the contract shape. */
export function fromEditable(fields) {
  return {
    title: fields.title,
    summary: fields.summary,
    quiz: { question: fields.question, answer: fields.answer },
    source_quote: fields.quote,
  };
}

const FIELD_LABELS = {
  title: 'Title',
  summary: 'Summary',
  question: 'Quiz question',
  answer: 'Quiz answer',
  quote: 'Source quote',
};

/** Labels of the form fields that are empty. These block approval. */
export function missingFields(fields) {
  return Object.keys(FIELD_LABELS)
    .filter((key) => !String(fields[key] ?? '').trim())
    .map((key) => FIELD_LABELS[key]);
}

/** Contract-shape problems that are not about the source text. */
export function contractIssues(lesson) {
  const issues = [];
  if (lesson.quiz.question.trim() && !lesson.quiz.question.includes('____')) {
    issues.push('The quiz question needs one blank, written as ____.');
  }
  return issues;
}

/** A plain object with only the contract keys, in contract order. */
export function toContract(lesson) {
  return {
    title: lesson.title,
    summary: lesson.summary,
    quiz: { question: lesson.quiz.question, answer: lesson.quiz.answer },
    source_quote: lesson.source_quote,
  };
}

/** The exact JSON a lesson is copied as. */
export function toContractJson(lesson) {
  return JSON.stringify(toContract(lesson), null, 2);
}
