import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PublicLayout } from './components/layout/PublicLayout';
import { PageLoading } from './components/layout/PageLoading';

// Lazy-loaded per must_haves artifact spec (router.tsx: "lazy-loaded") -
// each route's chunk (and its dependencies, e.g. DynamicForm/AddressAutocomplete
// for the submission route) is only fetched when the citizen actually
// navigates there.
const FormCatalogPage = lazy(() =>
  import('./features/catalog/pages/FormCatalogPage').then((m) => ({
    default: m.FormCatalogPage,
  })),
);
const SubmissionPage = lazy(() =>
  import('./features/submission/pages/SubmissionPage').then((m) => ({
    default: m.SubmissionPage,
  })),
);
const TrackingPage = lazy(() =>
  import('./features/tracking/pages/TrackingPage').then((m) => ({
    default: m.TrackingPage,
  })),
);
const AccessibilityStatement = lazy(() =>
  import('./components/accessibility/AccessibilityStatement').then((m) => ({
    default: m.AccessibilityStatement,
  })),
);

function NotFoundPage() {
  const { t } = useTranslation('common');
  return (
    <div className="text-center p-lg">
      <h1>404</h1>
      <p>{t('notFound')}</p>
    </div>
  );
}

/**
 * Public route table:
 * - `/` — form catalog
 * - `/form/:formKey` — dynamic schema-driven submission form
 * - `/tracking` — tracking-code lookup
 * - `/tracking/:code` — direct link to a submission's status (e.g. from a
 *   bookmarked confirmation)
 * - `/pristupnost` — FR-08.6 accessibility statement
 *
 * All routes render inside `PublicLayout` (Header/Footer persist across
 * navigation); each page component is lazy-loaded with a shared
 * `<PageLoading>` Suspense fallback.
 */
export function AppRouter() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<FormCatalogPage />} />
          <Route path="/form/:formKey" element={<SubmissionPage />} />
          <Route path="/tracking" element={<TrackingPage />} />
          <Route path="/tracking/:code" element={<TrackingPage />} />
          <Route path="/pristupnost" element={<AccessibilityStatement />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
