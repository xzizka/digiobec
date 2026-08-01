import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

/**
 * Public shell for every citizen-web page: sticky header (logo, nav,
 * language switch), a labelled `<main>` landmark that the header's
 * skip-link targets, and the footer (contacts + accessibility statement
 * link). Rendered once as the layout `Route` element; page content renders
 * via `<Outlet />`.
 *
 * Renders Header/main/Footer as a fragment (not a wrapping `<div>`) because
 * `#root` (index.css) is already `display:flex; flex-direction:column;
 * min-height:100vh` - `.public-main { flex: 1 }` only pushes the footer down
 * if it is a direct flex child of that container.
 */
export function PublicLayout() {
  return (
    <>
      <Header />
      <main id="main-content" className="public-main" role="main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
