// AI-AGENT-HEADER
// path: /src/App.tsx
// summary: Lightweight router that keeps the existing builder and adds the /eletters dashboard.
// last-reviewed: 2025-12-17
// line-range: 1-140

import { useEffect, useMemo, useState } from 'react';
import { ElettersDashboardPage } from './pages/ElettersDashboardPage';
import { ElettersAnalyticsPage } from './pages/ElettersAnalyticsPage';
import { BuilderPage } from './pages/BuilderPage';

type Route =
  | { name: 'dashboard' }
  | { name: 'analytics' }
  | { name: 'builder'; draftId: string | null };

function parseRoute(pathname: string): Route {
  const clean = pathname.split('?')[0]?.split('#')[0] ?? '/';
  if (clean === '/eletters/analytics') return { name: 'analytics' };
  if (clean === '/eletters' || clean.startsWith('/eletters/')) return { name: 'dashboard' };
  if (clean === '/') return { name: 'dashboard' };
  if (clean === '/builder' || clean.startsWith('/builder/')) {
    const parts = clean.split('/').filter(Boolean);
    return { name: 'builder', draftId: parts[1] ?? null };
  }
  // Default: fall back to the dashboard.
  return { name: 'dashboard' };
}

function navigate(to: string) {
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handler = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  useEffect(() => {
    if (pathname === '/') {
      navigate('/eletters');
    }
  }, [pathname]);

  const route = useMemo(() => parseRoute(pathname), [pathname]);

  if (route.name === 'dashboard') {
    return (
      <ElettersDashboardPage
        onOpenDraft={(draftId) => {
          navigate(`/builder/${draftId}`);
        }}
      />
    );
  }

  if (route.name === 'analytics') {
    return (
      <ElettersAnalyticsPage
        onOpenDraft={(draftId) => {
          navigate(`/builder/${draftId}`);
        }}
      />
    );
  }

  return <BuilderPage draftId={route.draftId} />;
}

export default App;
