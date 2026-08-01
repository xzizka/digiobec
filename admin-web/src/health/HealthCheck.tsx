import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useState } from 'react';

interface HealthComponent {
  status: string;
  details?: Record<string, unknown>;
}

interface HealthResponse {
  status: string;
  components?: Record<string, HealthComponent>;
  build?: Record<string, unknown>;
  git?: Record<string, unknown>;
  uptime?: Record<string, unknown>;
}

export function HealthCheck(): JSX.Element {
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.getHealth(),
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 1,
  });

  const handleRefresh = () => {
    refetch();
    setLastRefreshed(new Date());
  };

  const getStatusColor = (status: string): string => {
    switch (status.toUpperCase()) {
      case 'UP':
        return 'var(--color-success)';
      case 'DOWN':
        return 'var(--color-error)';
      case 'OUT_OF_SERVICE':
        return 'var(--color-warning)';
      default:
        return 'var(--color-gray-500)';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status.toUpperCase()) {
      case 'UP':
        return '✓';
      case 'DOWN':
        return '✕';
      case 'OUT_OF_SERVICE':
        return '⚠';
      default:
        return '?';
    }
  };

  const formatTime = (date: Date | null): string => {
    if (!date) return 'Never';
    return date.toLocaleTimeString();
  };

  return (
    <main className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-8)' }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ marginBottom: 'var(--space-2)' }}>System Health</h1>
        <p className="text-muted">Backend service status and component health</p>
      </header>

      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <span
                style={{
                  fontSize: '3rem',
                  color: data ? getStatusColor(data.status) : 'var(--color-gray-500)',
                  lineHeight: 1,
                }}
                role="img"
                aria-label={`Status: ${data?.status || 'Unknown'}`}
              >
                {data ? getStatusIcon(data.status) : '?'}
              </span>
              <div>
                <h2 style={{
                  fontSize: 'var(--font-size-3xl)',
                  fontWeight: 'var(--font-weight-bold)',
                  color: data ? getStatusColor(data.status) : 'var(--color-gray-500)',
                  margin: 0,
                }}>
                  {data?.status?.toUpperCase() || 'UNKNOWN'}
                </h2>
                <p className="text-muted" style={{ margin: 0 }}>
                  {isLoading ? 'Checking backend health...' : `Last checked: ${formatTime(lastRefreshed)}`}
                </p>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleRefresh}
              disabled={isLoading}
              aria-label="Refresh health status"
            >
              <span className="spinner" style={{ display: isLoading ? 'inline-block' : 'none' }} aria-hidden="true" />
              <span style={{ display: isLoading ? 'none' : 'inline' }}>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {data?.components && (
        <section aria-labelledby="components-heading" style={{ marginBottom: 'var(--space-6)' }}>
          <h2 id="components-heading" style={{ marginBottom: 'var(--space-4)' }}>Components</h2>
          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th scope="col">Component</th>
                    <th scope="col">Status</th>
                    <th scope="col">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.components).map(([name, component]) => (
                    <tr key={name}>
                      <td style={{ fontWeight: 'var(--font-weight-medium)' }}>
                        {name.charAt(0).toUpperCase() + name.slice(1)}
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: `${getStatusColor(component.status)}20`,
                            color: getStatusColor(component.status),
                          }}
                        >
                          {component.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {component.details && Object.keys(component.details).length > 0 ? (
                          <details>
                            <summary className="text-sm" style={{ cursor: 'pointer', color: 'var(--color-primary)' }}>
                              View details
                            </summary>
                            <pre style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-xs)' }}>
                              {JSON.stringify(component.details, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-muted">No details</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {error && (
        <section aria-labelledby="error-heading" style={{ marginBottom: 'var(--space-6)' }}>
          <h2 id="error-heading" style={{ marginBottom: 'var(--space-4)', color: 'var(--color-error)' }}>Error</h2>
          <div className="alert alert-error">
            <div>
              <strong>Failed to fetch health status</strong>
              <pre style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-xs)' }}>
                {error instanceof Error ? error.message : String(error)}
              </pre>
            </div>
          </div>
        </section>
      )}

      {(data?.build || data?.git || data?.uptime) && (
        <section aria-labelledby="debug-heading">
          <h2 id="debug-heading" style={{ marginBottom: 'var(--space-4)' }}>Debug Information</h2>
          <div className="card">
            <div className="card-body">
              {data.build && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--space-2)' }}>Build</h3>
                  <pre style={{ fontSize: 'var(--font-size-xs)' }}>
                    {JSON.stringify(data.build, null, 2)}
                  </pre>
                </div>
              )}
              {data.git && (
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--space-2)' }}>Git</h3>
                  <pre style={{ fontSize: 'var(--font-size-xs)' }}>
                    {JSON.stringify(data.git, null, 2)}
                  </pre>
                </div>
              )}
              {data.uptime && (
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-base)', marginBottom: 'var(--space-2)' }}>Runtime</h3>
                  <pre style={{ fontSize: 'var(--font-size-xs)' }}>
                    {JSON.stringify(data.uptime, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}