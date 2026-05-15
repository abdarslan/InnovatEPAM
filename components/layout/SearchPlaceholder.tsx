export default function SearchPlaceholder() {
  return (
    <div
      data-testid="search-placeholder"
      className="min-w-32 select-none rounded-md border border-dashed border-[var(--color-shell-border)] px-3 py-1.5 text-xs text-[var(--color-shell-text-muted)] md:min-w-40 lg:min-w-56"
      aria-hidden="true"
    >
      Search placeholder
    </div>
  )
}