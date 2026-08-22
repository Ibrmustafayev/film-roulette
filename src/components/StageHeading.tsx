/**
 * Stage section head. Left-aligned to the grid, count set in the data face,
 * closed by a directional rule. No box, no centring, no eyebrow.
 */
export function StageHeading({
  title,
  subtitle,
  count,
}: {
  title: string;
  subtitle?: string;
  count?: number;
}) {
  return (
    <header className="mb-8">
      <div className="flex items-baseline gap-4">
        <h1 className="text-title leading-[1.1] tracking-[-0.02em] text-ink-9">
          {title}
        </h1>
        {typeof count === "number" && count > 0 && (
          <span className="text-h4 text-ink-6" data-num>
            {count}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-2 max-w-[56ch] font-prose text-h4 leading-[1.5] text-ink-7">
          {subtitle}
        </p>
      )}
      <div className="stage-rule mt-6" />
    </header>
  );
}
