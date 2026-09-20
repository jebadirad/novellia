'use client';
import Link from 'next/link';
import { Theme } from '@astryxdesign/core/theme';
import { LinkProvider } from '@astryxdesign/core/Link';
import { novelliaTheme } from '@/generated/theme/novellia';
import { ToastViewport } from '@astryxdesign/core/Toast';
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Theme theme={novelliaTheme} mode="light">
      <LinkProvider component={Link}>
        {children}
        <ToastViewport />
      </LinkProvider>
    </Theme>
  );
}
