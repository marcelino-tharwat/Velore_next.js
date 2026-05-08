/** Consistent English (US) date formatting for the storefront. */

const dateTimeOpts: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
};

const dateOpts: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
};

export function formatDateTime(value: Date | string | number): string {
  const d =
    typeof value === "string" || typeof value === "number"
      ? new Date(value)
      : value;
  return d.toLocaleString("en-US", dateTimeOpts);
}

export function formatDate(value: Date | string | number): string {
  const d =
    typeof value === "string" || typeof value === "number"
      ? new Date(value)
      : value;
  return d.toLocaleDateString("en-US", dateOpts);
}
