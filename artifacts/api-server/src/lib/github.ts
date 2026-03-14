import { ReplitConnectors } from "@replit/connectors-sdk";

// GitHub connector via Replit OAuth proxy.
// Tokens are managed and refreshed automatically — do not cache the connectors instance across requests.
export async function githubRequest(
  endpoint: string,
  options: { method?: string; body?: unknown } = {}
): Promise<unknown> {
  const connectors = new ReplitConnectors();
  const response = await connectors.proxy("github", endpoint, {
    method: options.method ?? "GET",
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  return response.json();
}
