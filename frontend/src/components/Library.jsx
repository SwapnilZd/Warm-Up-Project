import { toContract, toContractJson } from '../lib/lessonContract';
import { copyText } from '../lib/clipboard';

// PRD FR-7: approved lessons are listed. Each can be copied as JSON or removed.
export default function Library({ library, rejected, onRemove, announce }) {
  async function copy(text, message) {
    const ok = await copyText(text);
    announce(ok ? message : 'Copy is not available here. Select the JSON and copy it.');
  }

  return (
    <>
      <h1 tabIndex={-1}>Library</h1>
      <p className="lead">Approved lessons are kept in this browser only.</p>

      {library.length === 0 ? (
        <div className="empty">
          No approved lessons yet. Run the agents, review the lesson, and approve it to see it here.
        </div>
      ) : (
        <>
          <div className="actions bottom-gap">
            <button
              className="secondary"
              type="button"
              onClick={() =>
                copy(
                  JSON.stringify(library.map((item) => toContract(item.lesson)), null, 2),
                  'All lessons copied as JSON.',
                )
              }
            >
              Copy all as JSON
            </button>
          </div>
          <div className="cards">
            {library.map((item, index) => (
              <article className="card" key={`${item.approvedAt}-${index}`} aria-labelledby={`lib-${index}`}>
                <h3 id={`lib-${index}`}>{item.lesson.title}</h3>
                <p className="count">Approved {item.approvedAt}</p>
                <p>{item.lesson.summary}</p>
                <pre>{toContractJson(item.lesson)}</pre>
                <div className="actions">
                  <button
                    className="secondary"
                    type="button"
                    aria-label={`Copy JSON for ${item.lesson.title}`}
                    onClick={() => copy(toContractJson(item.lesson), `Copied “${item.lesson.title}” as JSON.`)}
                  >
                    Copy JSON
                  </button>
                  <button
                    className="ghost"
                    type="button"
                    aria-label={`Remove ${item.lesson.title}`}
                    onClick={() => onRemove(index)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {rejected.length > 0 && (
        <section aria-labelledby="rejected-h" className="top-gap-lg">
          <h2 id="rejected-h" className="flush">Rejected</h2>
          <ul className="plain-list">
            {rejected.map((item, index) => (
              <li key={`${item.rejectedAt}-${index}`}>
                <strong>{item.title}</strong> ({item.rejectedAt}): {item.reason}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
