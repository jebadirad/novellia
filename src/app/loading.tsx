export default function Loading() {
  return (
    <div aria-label="Loading page" role="status">
      <div className="h-10 w-70 max-w-full animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
      <div className="mt-4 h-6 w-3/5 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
      <div className="mt-6 grid grid-cols-1 gap-5.5 md:grid-cols-3 [&>div]:h-40">
        {[0, 1, 2].map((i) => (
          <div
            className="h-6 animate-pulse rounded-md bg-muted motion-reduce:animate-none"
            key={i}
          />
        ))}
      </div>
      <div className="mt-6 h-70 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
    </div>
  );
}
