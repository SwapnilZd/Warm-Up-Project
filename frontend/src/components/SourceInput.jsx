import { useId } from 'react';
import { MAX_CHARS, formatCount, sourceStatus } from '../lib/sourceText';

// PRD FR-1: source input with a live count, a clear reason when the text is the wrong length,
// and a one-click sample.
export default function SourceInput({ text, onChange, onLoadSample, onRun, running }) {
  const id = useId();
  const status = sourceStatus(text);
  const runDisabled = !status.ok || running;

  return (
    <>
      <h1 tabIndex={-1}>Source text</h1>
      <p className="lead">
        Paste a short public text. Two agents turn it into one micro-lesson, and then you review it.
      </p>

      <div className="panel">
        <label htmlFor={`${id}-src`}>Source text</label>
        <textarea
          id={`${id}-src`}
          rows={9}
          value={text}
          onChange={(event) => onChange(event.target.value)}
          aria-describedby={`${id}-count ${id}-msg`}
          aria-invalid={!status.ok}
          spellCheck={false}
        />

        <div className="row">
          <span id={`${id}-count`} className="count">
            {formatCount(status.count)} of {formatCount(MAX_CHARS)} characters
          </span>
          <button className="ghost" type="button" onClick={onLoadSample}>
            Load sample text
          </button>
        </div>

        <div className="actions">
          {/* aria-disabled rather than disabled, so keyboard users can reach the button and hear the reason. */}
          <button
            className="primary"
            type="button"
            aria-disabled={runDisabled}
            aria-describedby={`${id}-msg`}
            onClick={() => {
              if (!runDisabled) onRun();
            }}
          >
            {running ? 'Running…' : 'Run the agents'}
          </button>
          <span id={`${id}-msg`} className={status.ok ? 'msg' : 'msg bad'}>
            {status.message}
          </span>
        </div>
      </div>
    </>
  );
}
