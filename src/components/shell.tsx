'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SideNav } from '@astryxdesign/core/SideNav';
import {
  PawPrint,
  LayoutDashboard,
  Heart,
  Files,
  CalendarCheck2,
  ArrowUpRight,
} from 'lucide-react';
import s from './styles.module.css';
const navigation = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/pets', label: 'Pets', icon: Heart },
  { href: '/records', label: 'Records', icon: Files },
  { href: '/follow-ups', label: 'Follow-ups', icon: CalendarCheck2 },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const links = navigation.map(({ href, label, icon: Icon }) => (
    <Link
      key={href}
      href={href}
      className={`${s.navLink} ${(href === '/' ? path === '/' : path.startsWith(href)) ? s.navActive : ''}`}
      aria-current={(href === '/' ? path === '/' : path.startsWith(href)) ? 'page' : undefined}
    >
      <Icon size={19} />
      <span>{label}</span>
    </Link>
  ));
  return (
    <div className={s.shell}>
      <a href="#main" className={s.skip}>
        Skip to content
      </a>
      <aside className={s.sidebar}>
        <SideNav
          style={{ height: '100%', width: '100%', background: 'transparent', border: 0 }}
          header={
            <Link href="/" className={s.brand}>
              <span className={s.brandMark}>
                <PawPrint size={23} />
              </span>
              <span>
                novellia<span className={s.brandSub}>PETS</span>
              </span>
            </Link>
          }
          footer={
            <div className={s.sidebarNote}>
              <span className={s.demoDot} /> Shared demo<p>Please use fictional information.</p>
              <span className={s.noteSmall}>
                A little care goes a long way.
                <ArrowUpRight size={14} />
              </span>
            </div>
          }
        >
          <div className={s.navSection}>YOUR COMPANIONS</div>
          <nav aria-label="Main navigation" className={s.nav}>
            {links}
          </nav>
        </SideNav>
      </aside>
      <header className={s.mobileHeader}>
        <Link href="/" className={s.brand}>
          <PawPrint size={22} /> novellia pets
        </Link>
        <span className={s.noteSmall}>Shared demo</span>
      </header>
      <main id="main" className={s.main}>
        <div className={s.topLine}>
          <span>GOOD CARE STARTS WITH KNOWING.</span>
          <span className={s.topNote}>
            <span className={s.demoDot} /> Made for your best friends
          </span>
        </div>
        {children}
        <footer className={s.pageFooter}>
          Novellia Pets <span>Shared demo · Please use fictional information.</span>
        </footer>
      </main>
      <nav className={s.mobileNav} aria-label="Mobile navigation">
        {links}
      </nav>
    </div>
  );
}
