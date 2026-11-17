// STAND-IN for the Reviewer agent (track 2). The review screen only needs
// { verdict, issues } back for a source and a lesson. This version does only two plain-code
// checks from FR-3, so Check again has something to show. Replace it with the real
// Reviewer call when that track is merged.
import { contractIssues } from '../lib/lessonContract';

export function reviewLesson(source, lesson) {
  const issues = contractIssues(lesson);
  const quote = lesson.source_quote.trim();
  const answer = lesson.quiz.answer.trim();
  if (quote && !source.includes(quote)) {
    issues.push('The source quote is not an exact piece of the source text.');
  }
  if (answer && quote && !quote.includes(answer)) {
    issues.push('The quiz answer does not appear in the source quote.');
  }
  return { verdict: issues.length ? 'revise' : 'approve', issues };
}
