import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import StickyActions from './StickyActions';
import { usePath } from '../lib/route';

export default function Layout({ children, overlay = false }: { children: ReactNode; overlay?: boolean }) {
  const path = usePath();
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header current={path} overlay={overlay} />
      <main id="main">{children}</main>
      <Footer />
      <StickyActions current={path} />
    </>
  );
}
