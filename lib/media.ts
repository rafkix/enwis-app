/**
 * Backend endpoints that return a stored file (avatar, uploaded image,
 * etc.) hand back whatever path the file lives at on the server — which
 * is often a *relative* path like "/uploads/avatars/xyz.jpg", meant to be
 * resolved against the API's own origin (api.enwis.uz), not the frontend's.
 *
 * This resolves straight to the API origin rather than routing through
 * next.config.ts's /uploads,/media,/static rewrites — those rewrites
 * depend on a BACKEND_ORIGIN env var being set correctly wherever the
 * frontend is deployed (defaults to http://localhost:8000 if missing,
 * which silently breaks every image in production). <img>/<Image> loads
 * are not subject to CORS the way fetch()/XHR calls are, so pointing
 * directly at the API origin is safe and removes that failure mode
 * entirely.
 */
const API_ORIGIN = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"
).replace(/\/api\/v\d+\/?$/, "");

export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;

  // Already absolute (http/https) or a data: URI — nothing to resolve.
  if (/^(https?:)?\/\//i.test(path) || path.startsWith("data:")) {
    return path;
  }

  // Bare relative path from the backend (e.g. "uploads/avatars/x.jpg" or
  // "/uploads/avatars/x.jpg") — resolve it against the API's own origin.
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_ORIGIN}${normalized}`;
}