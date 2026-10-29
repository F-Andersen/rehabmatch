export function sanitizePlainText(input: string): string {
  return input
    .replace(/<[^>]*>/g, "")
    // eslint-disable-next-line no-control-regex -- Remove non-printable C0 controls, preserving tabs and newlines.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim();
}
