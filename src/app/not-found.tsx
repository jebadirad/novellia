import { Button } from '@/components/ui';
export default function NotFound() {
  return (
    <div className="mx-auto my-12 max-w-xl rounded-xl border border-border bg-surface px-4.5 py-7.5 text-center md:p-10 [&>h1]:mb-3 [&>h1]:text-2xl [&>p]:mb-5.5 [&>p]:text-secondary">
      <h1>This page wandered off.</h1>
      <p>The pet or record may have been deleted, or the link may be incorrect.</p>
      <Button href="/pets" label="Back to your pets" variant="primary" />
    </div>
  );
}
