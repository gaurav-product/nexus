import { describe, expect, it } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEMO_SOURCES, DemoConnector, type RawSource, type SourceConnector } from '@nexus/core';
import { App } from '../src/App';

function renderApp(connector?: SourceConnector, hash = '#/inbox/needs_attention') {
  window.location.hash = hash;
  return render(<App connector={connector} />);
}

class FailingConnector implements SourceConnector {
  id = 'failing';
  mode = 'demo' as const;
  label = 'failing';
  calls = 0;
  async fetch(): Promise<RawSource[]> {
    this.calls++;
    if (this.calls === 1) throw new Error('boom');
    return structuredClone(DEMO_SOURCES);
  }
}

describe('Situation Inbox', () => {
  it('shows a loading state, then the headline and the six items', async () => {
    renderApp();
    expect(screen.getByText('Reading your sources…')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: '6 things need your attention' })).toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'Needs attention' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(6);
    // D-013 ordering: the strong conflict is first
    expect(within(list).getAllByRole('link')[0]).toHaveTextContent('Acme interview: date conflict');
  });

  it('always labels demo mode', async () => {
    renderApp();
    expect(await screen.findByText('Demo mode, fictional data')).toBeInTheDocument();
  });

  it('opens a conflict with both versions, evidence and a next step', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(await screen.findByRole('link', { name: /Acme interview: date conflict/ }));
    const detail = screen.getByRole('article');
    expect(within(detail).getByRole('heading', { level: 2 })).toHaveTextContent('Acme interview: date conflict');
    expect(within(detail).getByText('Sources disagree')).toBeInTheDocument();
    expect(within(detail).getByText('Version A').parentElement).toHaveTextContent('Mon 5 Oct, 11:00 2 sources');
    expect(within(detail).getByText('Version B').parentElement).toHaveTextContent('Tue 6 Oct, 11:00 1 source');
    // highlighted source text is present as a <mark>
    expect(detail.querySelectorAll('mark.evidence-mark').length).toBe(3);
    expect(within(detail).getByText(/Confirm the date with Neha Kapoor/)).toBeInTheDocument();
    expect(within(detail).getByText(/never sends, changes or deletes/)).toBeInTheDocument();
  });

  it('resolving a conflict requires a choice, then shows it confirmed and logs it', async () => {
    const user = userEvent.setup();
    renderApp(undefined, '#/inbox/conflicts');
    await user.click(await screen.findByRole('link', { name: /Acme interview/ }));
    await user.click(screen.getByRole('button', { name: 'Choose the correct version' }));
    const dialog = screen.getByRole('dialog', { name: 'Which version is correct?' });
    const save = within(dialog).getByRole('button', { name: 'Save answer' });
    expect(save).toBeDisabled();
    await user.click(within(dialog).getByRole('radio', { name: /Mon 5 Oct, 11:00/ }));
    await user.click(save);
    expect(await screen.findByText('You confirmed Mon 5 Oct, 11:00 is correct.')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    // moved out of the Conflicts list
    expect(within(screen.getByRole('list', { name: 'Conflicts' })).queryByText(/Acme interview/)).not.toBeInTheDocument();
    // audit log
    await user.click(screen.getAllByRole('link', { name: 'Activity' })[0]!);
    expect(await screen.findByText(/You confirmed Mon 5 Oct, 11:00 is correct/)).toBeInTheDocument();
  });

  it('dismiss as wrong removes it from Needs attention and records a false-positive event', async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(await screen.findByRole('link', { name: /Signed NDA not found/ }));
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    await user.click(screen.getByRole('button', { name: /This is wrong/ }));
    expect(await screen.findByRole('heading', { level: 1, name: '5 things need your attention' })).toBeInTheDocument();
    await user.click(screen.getAllByRole('link', { name: 'Activity' })[0]!);
    expect(await screen.findByText('feedback.false_positive')).toBeInTheDocument();
  });

  it('reopen brings a resolved item back', async () => {
    const user = userEvent.setup();
    renderApp(undefined, '#/inbox/resolved');
    await user.click(await screen.findByRole('link', { name: /Portfolio deck appears sent/ }));
    expect(screen.getByText(/Appears fulfilled/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reopen' }));
    await waitFor(() => expect(screen.getByText('Nothing resolved yet')).toBeInTheDocument());
  });

  it('change shows before and now, the stale calendar and the affected workshop', async () => {
    const user = userEvent.setup();
    renderApp(undefined, '#/inbox/changes');
    await user.click(await screen.findByRole('link', { name: /Flight KS 2134/ }));
    const table = screen.getByRole('table', { name: 'Before and after' });
    expect(within(table).getByRole('row', { name: /Departure 08:15 10:30/ })).toBeInTheDocument();
    expect(screen.getByText('Still showing the old time')).toBeInTheDocument();
    expect(screen.getByText('May be affected')).toBeInTheDocument();
  });

  it('switching to Sensitive adds the mailing-list deadline (E1)', async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole('heading', { level: 1, name: '6 things need your attention' });
    await user.click(screen.getByRole('radio', { name: /Sensitive/ }));
    expect(await screen.findByRole('heading', { level: 1, name: '7 things need your attention' })).toBeInTheDocument();
    expect(screen.getByText(/Early-bird pricing ends/)).toBeInTheDocument();
  });

  it('j / k move through the list', async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole('heading', { level: 1, name: '6 things need your attention' });
    await user.keyboard('j');
    await waitFor(() => expect(screen.getByRole('article')).toHaveTextContent('Acme interview: date conflict'));
    await user.keyboard('j');
    await waitFor(() => expect(screen.getByRole('article')).toHaveTextContent('Flight KS 2134'));
    await user.keyboard('k');
    await waitFor(() => expect(screen.getByRole('article')).toHaveTextContent('Acme interview'));
  });
});

describe('error, empty and permission states', () => {
  it('shows a safe error with retry when sources fail to load', async () => {
    const user = userEvent.setup();
    renderApp(new FailingConnector());
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Nexus could not read the demo sources.');
    expect(alert).not.toHaveTextContent('boom'); // no internal error text leaks
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { level: 1, name: '6 things need your attention' })).toBeInTheDocument();
  });

  it('shows a clear empty state when there is nothing to show', async () => {
    renderApp(new DemoConnector([]));
    expect(await screen.findByText('Nothing needs your attention', { selector: 'p' })).toBeInTheDocument();
  });

  it('turning a source off recalculates without it', async () => {
    const user = userEvent.setup();
    renderApp(undefined, '#/sources');
    await user.click(await screen.findByRole('switch', { name: 'Allow Nexus to read: Acme — Product Analyst interview (Round 2)' }));
    await user.click(screen.getAllByRole('link', { name: /Inbox/ })[0]!);
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText('Acme interview: date conflict')).not.toBeInTheDocument();
  });

  it('flags the injection email on the Sources page', async () => {
    renderApp(undefined, '#/sources');
    expect(await screen.findByText(/Contains text addressed to AI assistants/)).toBeInTheDocument();
  });

  it('delete all data asks for confirmation, then clears decisions', async () => {
    const user = userEvent.setup();
    renderApp(undefined, '#/inbox/conflicts');
    await user.click(await screen.findByRole('link', { name: /Acme interview/ }));
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    await user.click(screen.getByRole('button', { name: /Not relevant/ }));
    await user.click(screen.getAllByRole('link', { name: 'Sources' })[0]!);
    await user.click(await screen.findByRole('button', { name: /Delete all Nexus data/ }));
    await user.click(screen.getByRole('button', { name: /Yes, delete all Nexus data/ }));
    expect(localStorage.getItem('nexus.demo.v1')).not.toContain('dismiss');
  });
});
