import s from '@/components/styles.module.css';
export default function Loading() {
  return (
    <div aria-label="Loading page" role="status">
      <div className={s.skeleton} style={{ width: 280, height: 38 }} />
      <div className={s.skeleton} style={{ width: '60%', marginTop: 16 }} />
      <div className={s.loadingGrid}>
        {[0, 1, 2].map((i) => (
          <div className={s.skeleton} key={i} />
        ))}
      </div>
      <div className={s.skeleton} style={{ height: 280, marginTop: 24 }} />
    </div>
  );
}
