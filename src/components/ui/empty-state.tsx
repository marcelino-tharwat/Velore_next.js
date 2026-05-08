import Link from "next/link";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center fade-in">
      <p className="text-lg font-semibold tracking-tight text-foreground">{title}</p>
      {description ? (
        <p className="mt-2 max-w-md mx-auto text-sm leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="btn-primary mt-8 px-6"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
