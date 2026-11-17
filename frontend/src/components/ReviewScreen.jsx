import { useId, useState } from 'react';
import {
  fromEditable,
  missingFields,
  toEditable,
} from '../lib/lessonContract';
import { segmentsAroundQuote } from '../lib/highlight';
import { reviewLesson } from '../services/reviewer';

// A stable text form of the editable fields, used to tell whether the report is out of date.
const snapshot = (fields) => JSON.stringify(fromEditable(fields));

// PRD FR-6: the source beside the lesson with the quote highlighted. The reviewer can edit
// the fields and check again. Approve adds to the library. Reject needs a reason.
export default function ReviewScreen({ source, lesson, onApprove, onReject, announce }) {
  const id = useId();
  const [fields, setFields] = useState(() => toEditable(lesson));
  const [report, setReport] = useState(() => reviewLesson(source, lesson));
  const [checkedKey, setCheckedKey] = useState(() => snapshot(toEditable(lesson)));
  const [ack, setAck] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const highlight = segmentsAroundQuote(source, fields.quote);
  const stale = snapshot(fields) !== checkedKey;
  const openCount = report.issues.length;

  const setField = (key) => (event) => {
    const value = event.target.value;
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  function runChecks() {
    const next = reviewLesson(source, fromEditable(fields));
    setReport(next);
    setCheckedKey(snapshot(fields));
    setAck(false);
    setError('');
    announce(
      next.issues.length
        ? `Checks run. ${next.issues.length} ${next.issues.length === 1 ? 'issue' : 'issues'} open.`
        : 'Checks run. All checks passed.',
    );
  }

  function approve() {
    const missing = missingFields(fields);
    if (missing.length) {
      setError(`Fill in every field before you approve. Missing: ${missing.join(', ')}.`);
      return;
    }
    const fresh = reviewLesson(source, fromEditable(fields));
    setReport(fresh);
    setCheckedKey(snapshot(fields));
    if (fresh.issues.length && !ack) {
      setError('Tick the box to approve with open issues, or fix them and check again.');
      return;
    }
    onApprove(fromEditable(fields));
  }

  function confirmReject() {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError('Write a reason before you reject.');
      return;
    }
    onReject(trimmed);
  }

  return (
    <>
      <h1 tabIndex={-1}>Human review</h1>
      <p className="lead">
        Compare the lesson with its source. Edit anything that is wrong, check again, then approve or reject.
      </p>

      <div className="split">
        <section className="panel" aria-labelledby={`${id}-src-h`}>
          <h2 id={`${id}-src-h`} className="flush">Source</h2>
          {/* Focusable so keyboard users can scroll a long source. */}
          <div
            className="srcbox"
            role="group"
            tabIndex={0}
            aria-labelledby={`${id}-src-h`}
          >
            {highlight.segments.map((segment, i) =>
              segment.marked ? (
                <mark key={i}>{segment.text}</mark>
              ) : (
                <span key={i}>{segment.text}</span>
              ),
            )}
          </div>
          {!highlight.found && (
            <p className="msg bad top-gap">
              The source quote was not found in the source text, so nothing is highlighted.
            </p>
          )}
        </section>

        <section className="panel" aria-labelledby={`${id}-les-h`}>
          <h2 id={`${id}-les-h`} className="flush">Lesson</h2>

          <div className="field">
            <label htmlFor={`${id}-title`}>Title</label>
            <input id={`${id}-title`} type="text" value={fields.title} onChange={setField('title')} />
          </div>
          <div className="field">
            <label htmlFor={`${id}-summary`}>Summary</label>
            <textarea id={`${id}-summary`} rows={2} value={fields.summary} onChange={setField('summary')} />
          </div>
          <div className="field">
            <label htmlFor={`${id}-question`}>Quiz question</label>
            <textarea id={`${id}-question`} rows={2} value={fields.question} onChange={setField('question')} />
          </div>
          <div className="field">
            <label htmlFor={`${id}-answer`}>Quiz answer</label>
            <input id={`${id}-answer`} type="text" value={fields.answer} onChange={setField('answer')} />
          </div>
          <div className="field">
            <label htmlFor={`${id}-quote`}>Source quote</label>
            <textarea id={`${id}-quote`} rows={2} value={fields.quote} onChange={setField('quote')} />
          </div>

          <h3>
            Checks{' '}
            <span className={`pill ${openCount ? 'bad' : 'ok'}`}>
              {openCount ? `${openCount} open` : 'All passed'}
            </span>
          </h3>

          {stale && (
            <p className="notice" role="note">
              You changed a field since the last check. Check again to update the report.
            </p>
          )}

          <ul className="checks" aria-label="Review checks">
            {openCount === 0 && (
              <li>
                <span className="tick ok" aria-hidden="true">✓</span>
                <span>
                  <span className="sr-only">Passed: </span>All checks passed.
                </span>
              </li>
            )}
            {report.issues.map((issue) => (
              <li key={issue}>
                <span className="tick bad" aria-hidden="true">✕</span>
                <span>
                  <span className="sr-only">Open issue: </span>
                  {issue}
                </span>
              </li>
            ))}
          </ul>

          {openCount > 0 && (
            <label className="chk top-gap">
              <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
              I have read the open issues and want to approve anyway
            </label>
          )}

          <div className="actions top-gap">
            <button className="primary" type="button" onClick={approve}>
              Approve lesson
            </button>
            <button className="secondary" type="button" onClick={runChecks}>
              Check again
            </button>
            <button
              className="danger"
              type="button"
              aria-expanded={rejecting}
              onClick={() => {
                setRejecting(true);
                setError('');
              }}
            >
              Reject
            </button>
          </div>

          {error && (
            <p className="msg bad top-gap" role="alert">
              {error}
            </p>
          )}

          {rejecting && (
            <div className="field top-gap">
              <label htmlFor={`${id}-reason`}>Reason for rejecting</label>
              <textarea
                id={`${id}-reason`}
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                autoFocus
              />
              <div className="actions top-gap-sm">
                <button className="danger" type="button" onClick={confirmReject}>
                  Confirm reject
                </button>
                <button
                  className="ghost"
                  type="button"
                  onClick={() => {
                    setRejecting(false);
                    setError('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
