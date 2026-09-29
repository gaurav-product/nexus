import { Component, type ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { SourceConnector } from '@nexus/core';
import { StoreProvider } from './state/store';
import { Shell } from './components/Shell';
import { InboxPage } from './pages/InboxPage';
import { SourcesPage } from './pages/SourcesPage';
import { ActivityPage } from './pages/ActivityPage';
import { AboutPage } from './pages/AboutPage';
import { ResearchPage } from './pages/ResearchPage';

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="mx-auto max-w-md p-10 text-center">
        <p className="text-[17px] font-semibold">Something went wrong showing this page.</p>
        <p className="mt-1 text-[14px] text-muted">Your decisions are saved. Reload to try again.</p>
        <button type="button" className="mt-4 rounded-md bg-action px-3 py-1.5 text-action-ink" onClick={() => location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}

export function AppRoutes() {
  return (
    <Shell>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Navigate to="/inbox/needs_attention" replace />} />
          <Route path="/inbox" element={<Navigate to="/inbox/needs_attention" replace />} />
          <Route path="/inbox/:view" element={<InboxPage />} />
          <Route path="/inbox/:view/:id" element={<InboxPage />} />
          <Route path="/sources" element={<SourcesPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="*" element={<Navigate to="/inbox/needs_attention" replace />} />
        </Routes>
      </ErrorBoundary>
    </Shell>
  );
}

export function App({ connector }: { connector?: SourceConnector }) {
  return (
    <StoreProvider connector={connector}>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </StoreProvider>
  );
}
