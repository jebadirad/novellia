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
      className="flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-secondary transition-colors hover:bg-muted aria-[current=page]:bg-accent-muted aria-[current=page]:text-accent motion-reduce:transition-none max-md:flex-col max-md:gap-1 max-md:px-3 max-md:py-2 max-md:text-2xs"
      aria-current={(href === '/' ? path === '/' : path.startsWith(href)) ? 'page' : undefined}
    >
      <Icon size={19} />
      <span>{label}</span>
    </Link>
  ));
  return (
    <div className="min-h-screen bg-body font-sans text-base leading-relaxed text-primary">
      <a href="#main" className="fixed -top-16 left-4 z-50 bg-surface p-3 focus:top-2 md:left-60">
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-56 border-r border-border bg-surface px-4 pt-7.5 pb-4 md:block">
        <SideNav
          className="h-full w-full border-0 bg-transparent"
          header={
            <Link
              href="/"
              className="flex items-center gap-3 px-2 text-2xl leading-none font-bold tracking-tight max-md:gap-2 max-md:px-0 max-md:text-xl"
            >
              <span className="flex rounded-lg bg-accent-bg p-2.5 text-on-accent">
                <PawPrint size={23} />
              </span>
              <span>
                novellia
                <span className="mt-2 block text-2xs font-semibold tracking-[0.25em] text-secondary">
                  PETS
                </span>
              </span>
            </Link>
          }
          footer={
            <div className="mx-3 border-t border-border pt-5 text-xs text-secondary [&>p]:mt-2 [&>p]:mb-5">
              <span className="mr-1.5 inline-block size-1.5 rounded-full bg-accent-bg/60" /> Shared
              demo<p>Please use fictional information.</p>
              <span className="flex items-center gap-2 text-2xs text-secondary">
                A little care goes a long way.
                <ArrowUpRight size={14} />
              </span>
            </div>
          }
        >
          <div className="mx-3.5 mt-11 mb-3 text-2xs font-bold tracking-widest text-secondary">
            YOUR COMPANIONS
          </div>
          <nav aria-label="Main navigation" className="flex flex-col gap-2">
            {links}
          </nav>
        </SideNav>
      </aside>
      <header className="flex items-center justify-between border-b border-border bg-surface px-5 py-4.5 md:hidden">
        <Link
          href="/"
          className="flex items-center gap-3 px-2 text-2xl leading-none font-bold tracking-tight max-md:gap-2 max-md:px-0 max-md:text-xl"
        >
          <PawPrint size={22} /> novellia pets
        </Link>
        <span className="flex items-center gap-2 text-2xs text-secondary">Shared demo</span>
      </header>
      <main
        id="main"
        className="max-w-[1512px] px-4.5 pb-24 md:ml-56 md:px-6.5 md:pb-5 desk:px-11 wide:mr-auto wide:px-16"
      >
        <div className="mb-6 flex h-11 items-center justify-between border-b border-border text-2xs font-semibold tracking-widest text-secondary md:mb-8 md:h-18.5 md:text-2xs">
          <span>GOOD CARE STARTS WITH KNOWING.</span>
          <span className="hidden text-xs font-normal tracking-normal md:block">
            <span className="mr-1.5 inline-block size-1.5 rounded-full bg-accent-bg/60" /> Made for
            your best friends
          </span>
        </div>
        {children}
        <footer className="mt-12 flex justify-between gap-4 border-t border-border pt-5 text-2xs text-secondary [&>span]:max-w-48 [&>span]:text-right">
          Novellia Pets <span>Shared demo · Please use fictional information.</span>
        </footer>
      </main>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-border bg-surface px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden"
        aria-label="Mobile navigation"
      >
        {links}
      </nav>
    </div>
  );
}
