/**
 * Transport ONLY. This layer knows how to make an HTTP request and parse JSON.
 * It knows no endpoints, no DTOs, and no domain — deliberately not called a
 * "client", since `client` is a domain noun that must never appear in shared/.
 * Slices build their own typed queries on top of it in their data/ layer.
 */

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export interface HttpTransport {
  get(path: string): Promise<unknown>;
  post(path: string, body: unknown): Promise<unknown>;
  patch(path: string, body: unknown): Promise<unknown>;
}

export function createHttpTransport(baseUrl = ""): HttpTransport {
  async function request(method: string, path: string, body?: unknown): Promise<unknown> {
    const url = `${baseUrl}${path}`;
    const response = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      throw new HttpError(response.status, url, `${method} ${url} failed with ${response.status}`);
    }
    // A 2xx status is not proof of JSON. When the mock API isn't intercepting —
    // e.g. the MSW service worker was idle-terminated by the browser — the
    // request falls through to the dev server, which answers the SPA fallback
    // `index.html`: a 200 whose body is HTML. Parsing that yields the opaque
    // "Unexpected token '<'" crash, so fail with a legible error instead.
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new HttpError(
        response.status,
        url,
        `${method} ${url} returned ${contentType || "an unknown content type"} instead of JSON — is the mock API running?`,
      );
    }
    const data: unknown = await response.json();
    return data;
  }

  return {
    get: async (path) => request("GET", path),
    post: async (path, body) => request("POST", path, body),
    patch: async (path, body) => request("PATCH", path, body),
  };
}

/**
 * The default transport. Endpoint-free: slices pass their own absolute paths
 * (e.g. "/api/invoices") from their own data/ layer.
 */
export const httpTransport: HttpTransport = createHttpTransport();
