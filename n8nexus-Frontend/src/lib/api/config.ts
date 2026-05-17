/** Backend origin without trailing slash. Use `/api` in dev with the Vite proxy, or a full URL in production. */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim();
  if (raw) return raw.replace(/\/$/, "");
  return "https://n8nexus-backend-production.up.railway.app";
}
