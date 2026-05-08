export default function Logo({ className }: { className?: string }) {
  return (
    <span
      className={`font-heading text-brand-primary ${className ?? ""}`}
      style={{ letterSpacing: "0.15em", fontWeight: 400 }}
    >
      Velore
    </span>
  );
}

