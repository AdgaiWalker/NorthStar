export default function FeedSkeleton() {
  return (
    <div className="mb-3 w-full animate-pulse rounded-lg border border-border-light bg-surface p-5"
    >
      <div className="mb-3 h-5 w-16 rounded-full bg-bg-subtle"
      />
      <div className="mb-3 flex items-center gap-2"
      >
        <div className="h-7 w-7 rounded-full bg-bg-subtle"
        />
        <div className="h-4 w-20 rounded bg-bg-subtle"
        />
      </div>
      <div className="mb-2 h-5 w-3/4 rounded bg-bg-subtle"
      />
      <div className="mb-2 h-4 w-full rounded bg-bg-subtle"
      />
      <div className="h-4 w-2/3 rounded bg-bg-subtle"
      />
    </div>
  );
}

export function FeedSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <FeedSkeleton key={i} />
      ))}
    </>
  );
}
