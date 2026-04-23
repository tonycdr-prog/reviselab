const UTC_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function formatUiDateTime(value: string) {
  return `${UTC_FORMATTER.format(new Date(value))} UTC`;
}
