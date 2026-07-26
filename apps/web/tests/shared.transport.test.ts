import { afterEach, describe, expect, it, vi } from "vitest";
import { createHttpTransport, HttpError } from "../src/shared/http/transport";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(make: () => Response): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Promise.resolve(make())),
  );
}

describe("http transport", () => {
  it("parses a JSON response body", async () => {
    stubFetch(
      () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
    );
    const transport = createHttpTransport();
    await expect(transport.get("/api/x")).resolves.toEqual({ ok: true });
  });

  it("throws a legible HttpError when a 2xx body is HTML, not JSON", async () => {
    // The SPA fallback index.html the dev server serves when the mock API isn't
    // intercepting; the old code fed it to .json() and threw "Unexpected token '<'".
    stubFetch(
      () =>
        new Response("<!doctype html><title>app</title>", {
          status: 200,
          headers: { "content-type": "text/html" },
        }),
    );
    const transport = createHttpTransport();
    const result = await transport.get("/api/appointments").catch((error: unknown) => error);
    expect(result).toBeInstanceOf(HttpError);
    expect(result).toMatchObject({
      status: 200,
      message: expect.stringMatching(/instead of JSON/),
    });
  });

  it("throws HttpError on a non-ok status before reading the body", async () => {
    stubFetch(() => new Response(null, { status: 404 }));
    const transport = createHttpTransport();
    await expect(transport.get("/api/missing")).rejects.toThrow(/failed with 404/);
  });
});
