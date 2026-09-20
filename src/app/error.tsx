'use client';
import { Button } from '@/components/ui';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto my-12 max-w-xl rounded-xl border border-border bg-surface px-4.5 py-7.5 text-center md:p-10 [&>h1]:mb-3 [&>h1]:text-2xl [&>p]:mb-5.5 [&>p]:text-secondary">
      <h1>We couldn’t load this page.</h1>
      <p>Your saved information is still in the database. Please try again.</p>
      <Button label="Try again" onClick={reset} variant="primary" />
    </div>
  );
}
