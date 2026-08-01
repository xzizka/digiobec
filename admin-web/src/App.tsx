import { Routes, Route } from 'react-router-dom';
import { HealthCheck } from './health/HealthCheck';

function App(): JSX.Element {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <header style={{
        backgroundColor: 'var(--color-primary)',
        color: 'var(--color-text-on-primary)',
        padding: 'var(--space-4) var(--space-6)',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 'var(--font-size-xl)', margin: 0 }}>Občanský portál obce</h1>
          <nav aria-label="Main navigation">
            <ul style={{ display: 'flex', gap: 'var(--space-6)', listStyle: 'none', margin: 0, padding: 0 }}>
              <li><a href="/health" style={{ color: 'var(--color-text-on-primary)', textDecoration: 'none', fontWeight: 'var(--font-weight-medium)' }}>Health</a></li>
              <li><a href="/submissions" style={{ color: 'var(--color-text-on-primary)', textDecoration: 'none', fontWeight: 'var(--font-weight-medium)' }}>Submissions</a></li>
              <li><a href="/admin" style={{ color: 'var(--color-text-on-primary)', textDecoration: 'none', fontWeight: 'var(--font-weight-medium)' }}>Admin</a></li>
            </ul>
          </nav>
        </div>
      </header>
      <main id="main-content" style={{ flex: 1 }}>
        <Routes>
          <Route path="/health" element={<HealthCheck />} />
          <Route path="/" element={<HealthCheck />} />
          <Route path="/submissions" element={<div className="container" style={{ padding: 'var(--space-8)' }}><h2>Submissions - Coming Soon</h2></div>} />
          <Route path="/admin" element={<div className="container" style={{ padding: 'var(--space-8)' }}><h2>Admin Dashboard - Coming Soon</h2></div>} />
        </Routes>
      </main>
      <footer style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderTop: '1px solid var(--color-border)',
        padding: 'var(--space-6) var(--space-4)',
        marginTop: 'auto',
      }}>
        <div className="container" style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
          © 2024 Občanský portál obce. Built with React, TypeScript, and Vite.
        </div>
      </footer>
    </div>
  );
}

export default App;