import { useEffect, useRef, useState } from 'react';
import SourceInput from './components/SourceInput';
import ReviewScreen from './components/ReviewScreen';
import Library from './components/Library';
import { SAMPLE_TEXT } from './data/sample';
import { DEFAULT_STATE, readStoredState, writeStoredState } from './lib/storage';
import { sourceStatus } from './lib/sourceText';
import { stamp } from './lib/time';
import { runAgents } from './services/agents';
import './App.css';

const VIEWS = [
  ['source', 'Source'],
  ['review', 'Review'],
  ['library', 'Library'],
];

function getStorage() {
  try {
    return window.localStorage;
  } catch {
    return undefined; // blocked by the browser; the app still works for this visit
  }
}

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function App() {
  const [state, setState] = useState(() => readStoredState(getStorage(), DEFAULT_STATE));
  const [view, setView] = useState('source');
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState(''); // text for the screen-reader live region
  const mainRef = useRef(null);
  const moveFocusOnNav = useRef(false);

  useEffect(() => {
    writeStoredState(getStorage(), state);
  }, [state]);

  // After a view change, move focus to the new view so keyboard and screen-reader users land on it.
  useEffect(() => {
    if (moveFocusOnNav.current) {
      moveFocusOnNav.current = false;
      mainRef.current?.focus();
    }
  }, [view]);

  const announce = (message) => setStatus(message);

  function go(next) {
    moveFocusOnNav.current = true;
    setView(next);
  }

  function setSource(text) {
    setState((prev) => ({ ...prev, source: text }));
  }

  function loadSample() {
    setSource(SAMPLE_TEXT);
    announce('Sample text loaded.');
  }

  async function run() {
    const text = state.source;
    if (!sourceStatus(text).ok || running) return;
    setRunning(true);
    announce('Running the agents.');
    try {
      const { lesson } = await runAgents(text);
      setState((prev) => ({ ...prev, current: { id: newId(), lesson } }));
      announce('Lesson ready for review.');
      go('review');
    } catch {
      announce('The agents could not finish. Try again.');
    } finally {
      setRunning(false);
    }
  }

  function approve(lesson) {
    setState((prev) => ({
      ...prev,
      current: null,
      library: [{ lesson, approvedAt: stamp() }, ...prev.library],
    }));
    announce(`Approved “${lesson.title}”. Added to the library.`);
    go('library');
  }

  function reject(reason) {
    const title = state.current?.lesson.title ?? 'Untitled lesson';
    setState((prev) => ({
      ...prev,
      current: null,
      rejected: [{ title, reason, rejectedAt: stamp() }, ...prev.rejected],
    }));
    announce('Rejected. The reason is saved.');
    go('library');
  }

  function removeFromLibrary(index) {
    const removed = state.library[index];
    setState((prev) => ({ ...prev, library: prev.library.filter((_, i) => i !== index) }));
    if (removed) announce(`Removed “${removed.lesson.title}”.`);
  }

  const enabled = (name) => name !== 'review' || !!state.current;

  let content;
  if (view === 'source') {
    content = (
      <SourceInput
        text={state.source}
        onChange={setSource}
        onLoadSample={loadSample}
        onRun={run}
        running={running}
      />
    );
  } else if (view === 'review') {
    content = state.current ? (
      <ReviewScreen
        key={state.current.id}
        source={state.source}
        lesson={state.current.lesson}
        onApprove={approve}
        onReject={reject}
        announce={announce}
      />
    ) : (
      <>
        <h1 tabIndex={-1}>Human review</h1>
        <div className="empty">
          There is no lesson to review yet. Run the agents from the Source step first.
        </div>
      </>
    );
  } else {
    content = (
      <Library
        library={state.library}
        rejected={state.rejected}
        onRemove={removeFromLibrary}
        announce={announce}
      />
    );
  }

  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <header className="bar">
        <div className="brand">
          <strong>Warm-up pack</strong>
          <span>Review screen</span>
        </div>
      </header>
      <nav className="steps" aria-label="Steps">
        <ol>
          {VIEWS.map(([name, label], i) => (
            <li key={name}>
              <button
                type="button"
                aria-current={view === name ? 'step' : undefined}
                disabled={!enabled(name)}
                onClick={() => go(name)}
              >
                <span className="num" aria-hidden="true">{i + 1}</span>
                {label}
                {name === 'library' && state.library.length > 0 ? ` (${state.library.length})` : ''}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <main id="main" ref={mainRef} tabIndex={-1}>
        {content}
      </main>
      <div className="sr-only" role="status" aria-live="polite">
        {status}
      </div>
    </>
  );
}
