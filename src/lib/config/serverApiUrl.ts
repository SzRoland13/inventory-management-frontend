/**
 * Server-only backend base URL (no NEXT_PUBLIC_ prefix, never inlined into
 * the client bundle). Falls back to the same browser-facing URL/default the
 * client uses, but a containerized deployment where the server-facing and
 * browser-facing backend hostnames differ should set API_URL explicitly.
 */
export function getServerApiUrl(): string {
  return (
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8080/api/v1'
  );
}
