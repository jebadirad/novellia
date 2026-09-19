import { Button } from '@/components/ui';
import s from '@/components/styles.module.css';
export default function NotFound() {
  return (
    <div className={s.errorPage}>
      <h1>This page wandered off.</h1>
      <p>The pet or record may have been deleted, or the link may be incorrect.</p>
      <Button href="/pets" label="Back to your pets" variant="primary" />
    </div>
  );
}
