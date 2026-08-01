import { useHealth } from '../hooks/useHealth'
import { CheckCircle, XCircle, AlertCircle, Database, Server, RefreshCw, ExternalLink, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function DashboardPage() {
  const { data: health, isLoading, error, refetch } = useHealth()
  const { t: tHealth, t: tDashboard } = useTranslation('dashboard')
  const { t: tCommon } = useTranslation('common')

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'UP':
        return <CheckCircle className="w-6 h-6 text-success" aria-hidden="true" />
      case 'DOWN':
        return <XCircle className="w-6 h-6 text-error" aria-hidden="true" />
      default:
        return <AlertCircle className="w-6 h-6 text-warning" aria-hidden="true" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'UP':
        return tHealth('health.up')
      case 'DOWN':
        return tHealth('health.down')
      default:
        return tHealth('health.unknown')
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'UP':
        return 'badge-success'
      case 'DOWN':
        return 'badge-error'
      default:
        return 'badge-warning'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary">{tCommon('loading')}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="alert alert-error" role="alert">
        <XCircle className="w-5 h-5 inline-block mr-2" aria-hidden="true" />
        <span>{tCommon('networkError')}: {(error as Error).message}</span>
        <button
          onClick={() => refetch()}
          className="btn btn-sm btn-secondary ml-4"
        >
          <RefreshCw className="w-4 h-4 mr-1" aria-hidden="true" />
          {tCommon('retry')}
        </button>
      </div>
    )
  }

  const overallStatus = health?.status === 'UP' ? 'UP' : 'DOWN'
  const overallStatusLabel = overallStatus === 'UP' ? tDashboard('healthy') : tDashboard('unhealthy')

  return (
    <div id="main-content">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">{tDashboard('title')}</h1>
        <p className="text-text-secondary">{tDashboard('subtitle')}</p>
      </div>

      {/* System Status Card */}
      <section aria-labelledby="system-status-heading" className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 id="system-status-heading" className="text-xl font-semibold text-text-primary">
            {tDashboard('systemStatus')}
          </h2>
          <button
            onClick={() => refetch()}
            className="btn btn-sm btn-secondary"
            aria-label={tDashboard('refresh')}
          >
            <RefreshCw className="w-4 h-4 mr-1" aria-hidden="true" />
            {tDashboard('refresh')}
          </button>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    overallStatus === 'UP' ? 'bg-success/10' : 'bg-error/10'
                  }`}
                >
                  {getStatusIcon(overallStatus)}
                </div>
                <div>
                  <p className="text-lg font-semibold text-text-primary">{overallStatusLabel}</p>
                  <p className="text-sm text-text-secondary">
                    {tDashboard('backendVersion')}: {health?.version ?? tCommon('unknown')}
                  </p>
                </div>
              </div>
              <span className={`badge ${getStatusBadgeClass(overallStatus)} text-sm px-3 py-1`}>
                {overallStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Database Status */}
              <article className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Database className="w-5 h-5 text-primary" aria-hidden="true" />
                  <h3 className="font-medium text-text-primary">{tHealth('health.database')}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(health?.database ?? 'UNKNOWN')}
                  <span className={`badge ${getStatusBadgeClass(health?.database ?? 'UNKNOWN')}`}>
                    {getStatusLabel(health?.database ?? 'UNKNOWN')}
                  </span>
                </div>
              </article>

              {/* Keycloak Status */}
              <article className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-2">
                  <Server className="w-5 h-5 text-primary" aria-hidden="true" />
                  <h3 className="font-medium text-text-primary">{tHealth('health.identityProvider')}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(health?.keycloak ?? 'UNKNOWN')}
                  <span className={`badge ${getStatusBadgeClass(health?.keycloak ?? 'UNKNOWN')}`}>
                    {getStatusLabel(health?.keycloak ?? 'UNKNOWN')}
                  </span>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section aria-labelledby="quick-actions-heading" className="mb-8">
        <h2 id="quick-actions-heading" className="text-xl font-semibold text-text-primary mb-4">
          {tDashboard('quickActions')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a
            href="/submissions"
            className="card hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
                <h3 className="font-medium text-text-primary">{tDashboard('manageSubmissions')}</h3>
              </div>
              <p className="text-sm text-text-secondary">
                {tDashboard('manageSubmissionsDesc')}
              </p>
            </div>
          </a>

          <a
            href="/submissions?status=PENDING"
            className="card hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-warning" aria-hidden="true" />
                </div>
                <h3 className="font-medium text-text-primary">{tDashboard('pendingSubmissions')}</h3>
              </div>
              <p className="text-sm text-text-secondary">
                {tDashboard('pendingSubmissionsDesc')}
              </p>
            </div>
          </a>

          <a
            href="http://localhost:8081/api/v3/api-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="card hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="card-body">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-info" aria-hidden="true" />
                </div>
                <h3 className="font-medium text-text-primary">{tDashboard('apiDocs')}</h3>
              </div>
              <p className="text-sm text-text-secondary">
                {tDashboard('apiDocsDesc')}
              </p>
            </div>
          </a>
        </div>
      </section>

      {/* System Info */}
      <section aria-labelledby="system-info-heading" className="mb-8">
        <h2 id="system-info-heading" className="text-xl font-semibold text-text-primary mb-4">
          {tDashboard('systemInfo')}
        </h2>
        <div className="card">
          <div className="card-body">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-text-secondary">{tDashboard('version')}</dt>
                <dd className="font-mono text-text-primary">{health?.version ?? tCommon('unknown')}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">{tDashboard('timestamp')}</dt>
                <dd className="font-mono text-text-primary">
                  {health?.timestamp ? new Date(health.timestamp).toLocaleString() : tCommon('unknown')}
                </dd>
              </div>
              <div>
                <dt className="text-text-secondary">{tHealth('health.database')}</dt>
                <dd className="font-mono text-text-primary">{health?.database ?? tCommon('unknown')}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">{tHealth('health.identityProvider')}</dt>
                <dd className="font-mono text-text-primary">{health?.keycloak ?? tCommon('unknown')}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </div>
  )
}