const LoadingProfiles = ({
  count = 3,
  showAvatar = true,
  lines = 1,
  className = "",
}) => {
  const widths = ["w-40", "w-48", "w-32", "w-44", "w-36"];
  return (
    <div
      className={`flex flex-col px-2 gap-2 animate-pulse ${className}`}
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="user-info py-2 w-full flex gap-3 items-center">
          {showAvatar && (
            <div className="rounded-full bg-[var(--skeleton-color,theme(colors.slate.300))] ] h-12 w-12" />
          )}
          <div className="flex flex-col gap-2 flex-1">
            {Array.from({ length: lines }).map((_, li) => (
              <div
                key={li}
                className={`h-3 rounded-xl bg-[var(--skeleton-color,theme(colors.slate.300))] dark:bg-[var(--skeleton-dark-color,theme(colors.slate.600))] ${
                  widths[(i + li) % widths.length]
                }`}
              />
            ))}
          </div>
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingProfiles;
