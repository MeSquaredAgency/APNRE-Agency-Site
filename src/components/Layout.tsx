import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children, overlay = false }: { children: ReactNode; overlay?: boolean }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header current={window.location.pathname} overlay={overlay} />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
