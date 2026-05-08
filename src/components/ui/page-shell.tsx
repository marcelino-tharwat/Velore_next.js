export function PageShell({
  children,
  className = "",
  maxWidthClass = "max-w-6xl",
}: {
  children: React.ReactNode;
  className?: string;
  /** Use `max-w-3xl` for checkout-style narrow layouts. */
  maxWidthClass?: string;
}) {
  return (
    <main
      className={`mx-auto w-full ${maxWidthClass} px-4 py-10 sm:px-6 lg:px-8 ${className}`}
    >
      {children}
    </main>
  );
}
