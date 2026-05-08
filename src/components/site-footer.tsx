import { en } from "@/lib/site-copy";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-12 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-semibold tracking-tight text-primary">
            {en.footer.brand}
          </p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            {en.footer.tagline}
          </p>
        </div>
      </div>
    </footer>
  );
}
