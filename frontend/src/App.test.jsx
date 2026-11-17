import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { SAMPLE_TEXT } from './data/sample';
import { STORAGE_KEY } from './lib/storage';

// Helpers that find controls the way a keyboard or screen-reader user would.
const nav = () => screen.getByRole('navigation', { name: 'Steps' });
const goTo = async (user, name) => user.click(within(nav()).getByRole('button', { name: new RegExp(name) }));

async function runSample(user) {
  await user.click(screen.getByRole('button', { name: 'Load sample text' }));
  await user.click(screen.getByRole('button', { name: 'Run the agents' }));
  await screen.findByRole('heading', { name: 'Human review' });
}

describe('Review screen app', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('keeps Run disabled for short text and says why (FR-1)', async () => {
    const user = userEvent.setup();
    render(<App />);
    const run = screen.getByRole('button', { name: 'Run the agents' });
    expect(run).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('Add at least 50 characters. You have 0.')).toBeInTheDocument();

    await user.click(run); // a click on a disabled Run does nothing
    expect(screen.queryByRole('heading', { name: 'Human review' })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Source text'), 'a'.repeat(50));
    expect(run).toHaveAttribute('aria-disabled', 'false');
    expect(screen.getByText('50 of 3,000 characters')).toBeInTheDocument();
  });

  it('loads the sample, runs the agents and shows the lesson beside the highlighted quote (FR-6)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await runSample(user);

    const source = screen.getByRole('group', { name: 'Source' });
    expect(source.querySelector('mark')).toHaveTextContent(
      'Hold it at the same time every day, and keep it to 15 minutes.',
    );
    expect(source).toHaveTextContent(SAMPLE_TEXT.split('.')[0]);
    expect(screen.getByLabelText('Title')).toHaveValue('Running a stand-up');
    expect(screen.getByLabelText('Quiz answer')).toHaveValue('15');
    expect(screen.getByText('All checks passed.')).toBeInTheDocument();
  });

  it('re-runs the checks after an edit and reports the stale state', async () => {
    const user = userEvent.setup();
    render(<App />);
    await runSample(user);

    const answer = screen.getByLabelText('Quiz answer');
    await user.clear(answer);
    await user.type(answer, '20');
    expect(screen.getByText(/changed a field since the last check/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Check again' }));
    expect(screen.getByText('1 open')).toBeInTheDocument();
    expect(screen.getByText('The quiz answer does not appear in the source quote.')).toBeInTheDocument();
  });

  it('blocks approval until open issues are acknowledged, then adds to the library (FR-6, FR-7)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await runSample(user);

    const quote = screen.getByLabelText('Source quote');
    await user.clear(quote);
    await user.type(quote, 'Hold it at noon.');
    await user.click(screen.getByRole('button', { name: 'Check again' }));

    await user.click(screen.getByRole('button', { name: 'Approve lesson' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Tick the box to approve with open issues');

    await user.click(screen.getByLabelText(/approve anyway/));
    await user.click(screen.getByRole('button', { name: 'Approve lesson' }));

    expect(await screen.findByRole('heading', { name: 'Library' })).toBeInTheDocument();
    expect(screen.getByRole('article')).toHaveTextContent('Running a stand-up');
    expect(within(nav()).getByRole('button', { name: /Library \(1\)/ })).toBeInTheDocument();
  });

  it('approves a clean lesson straight away and copies it as contract JSON (FR-7)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await runSample(user);
    await user.click(screen.getByRole('button', { name: 'Approve lesson' }));

    const card = await screen.findByRole('article');
    expect(within(card).getByRole('button', { name: 'Copy JSON for Running a stand-up' })).toBeEnabled();
    expect(card.querySelector('pre').textContent).toContain('"source_quote"');
  });

  it('requires a reason to reject and saves it (FR-6)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await runSample(user);

    await user.click(screen.getByRole('button', { name: 'Reject' }));
    await user.click(screen.getByRole('button', { name: 'Confirm reject' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Write a reason before you reject.');

    await user.type(screen.getByLabelText('Reason for rejecting'), 'Too vague');
    await user.click(screen.getByRole('button', { name: 'Confirm reject' }));

    expect(await screen.findByRole('heading', { name: 'Library' })).toBeInTheDocument();
    expect(screen.getByText(/Too vague/)).toBeInTheDocument();
  });

  it('removes an approved lesson from the library (FR-7)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await runSample(user);
    await user.click(screen.getByRole('button', { name: 'Approve lesson' }));
    await screen.findByRole('article');

    await user.click(screen.getByRole('button', { name: 'Remove Running a stand-up' }));
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.getByText('No approved lessons yet. Run the agents, review the lesson, and approve it to see it here.')).toBeInTheDocument();
  });

  it('keeps settings, the library and the current lesson after a reload (FR-9)', async () => {
    const user = userEvent.setup();
    const first = render(<App />);
    await runSample(user);
    await user.click(screen.getByRole('button', { name: 'Approve lesson' }));
    await screen.findByRole('article');
    first.unmount();

    render(<App />);
    // The app opens on the Source step after a reload. The library is still there.
    expect(within(nav()).getByRole('button', { name: /Library \(1\)/ })).toBeInTheDocument();
    await goTo(userEvent.setup(), 'Library');
    expect(screen.getByRole('article')).toHaveTextContent('Running a stand-up');
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)).library).toHaveLength(1);
  });

  it('keeps the review usable when storage is blocked', async () => {
    const user = userEvent.setup();
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('quota');
    };
    try {
      render(<App />);
      await runSample(user);
      expect(screen.getByLabelText('Title')).toHaveValue('Running a stand-up');
    } finally {
      Storage.prototype.setItem = original;
    }
  });

  it('shows the review empty state before any lesson exists', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(within(nav()).getByRole('button', { name: 'Review' })).toBeDisabled();
    await goTo(user, 'Library');
    expect(screen.getByText('No approved lessons yet. Run the agents, review the lesson, and approve it to see it here.')).toBeInTheDocument();
  });

  it('announces status changes to screen readers (FR-10)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Load sample text' }));
    const live = document.querySelector('[role="status"][aria-live="polite"]');
    expect(live).toHaveTextContent('Sample text loaded.');
  });

  it('runs the whole flow with the keyboard only (FR-10)', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Tab until the control with this visible text has focus, then press Enter.
    async function tabTo(text) {
      for (let i = 0; i < 40; i += 1) {
        await user.tab();
        if (document.activeElement?.textContent?.trim() === text) return;
      }
      throw new Error(`Could not reach "${text}" with Tab`);
    }

    await user.tab();
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveFocus();

    await tabTo('Load sample text');
    await user.keyboard('{Enter}');
    expect(screen.getByLabelText('Source text')).toHaveValue(SAMPLE_TEXT);

    await tabTo('Run the agents');
    await user.keyboard('{Enter}');
    await screen.findByRole('heading', { name: 'Human review' });

    await tabTo('Approve lesson');
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('heading', { name: 'Library' })).toBeInTheDocument();
  });
});
