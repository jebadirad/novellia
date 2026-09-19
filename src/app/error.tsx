'use client';
import { Button } from '@/components/ui';
import s from '@/components/styles.module.css';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className={s.errorPage}>
      <h1>We couldn’t load this page.</h1>
      <p>Your saved information is still in the database. Please try again.</p>
      <Button label="Try again" onClick={reset} variant="primary" />
    </div>
  );
}
