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
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
  patch<T>(path: string, body: unknown): Promise<T>;
}

export function createHttpTransport(baseUrl = ""): HttpTransport {
  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${baseUrl}${path}`;
    const response = await fetch(url, {
      method,
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      throw new HttpError(response.status, url, `${method} ${url} failed with ${response.status}`);
    }
    return (await response.json()) as T;
  }

  return {
    get: (path) => request("GET", path),
    post: (path, body) => request("POST", path, body),
    patch: (path, body) => request("PATCH", path, body),
  };
}

/**
 * The default transport. Endpoint-free: slices pass their own absolute paths
 * (e.g. "/api/invoices") from their own data/ layer.
 */
export const httpTransport: HttpTransport = createHttpTransport();
