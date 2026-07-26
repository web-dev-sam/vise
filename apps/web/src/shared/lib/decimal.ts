/**
 * Fixed-point decimal <-> integer conversion. Money and rates cross the wire as
 * decimal strings ("12.34", "8.75"); internally we carry them as scaled integers
 * — minor units, basis points — so arithmetic never touches a float.
 */

/**
 * Parse a decimal string into an integer scaled by `10 ** scale`
 * (`"12.34", 2 -> 1234`). Fractional digits beyond `scale` are truncated.
 * Throws on non-numeric input rather than silently yielding `NaN`.
 */
export function parseScaled(value: string, scale: number): number {
  const match = /^(-)?(\d*)(?:\.(\d*))?$/.exec(value.trim());
  const [, sign, whole = "", fraction = ""] = match ?? [];
  if (!match || (whole === "" && fraction === "")) {
    throw new Error(`Not a decimal number: ${JSON.stringify(value)}`);
  }
  const digits = `${whole}${fraction.padEnd(scale, "0").slice(0, scale)}`;
  const magnitude = digits === "" ? 0 : Number(digits);
  return sign ? -magnitude : magnitude;
}

/**
 * Format a scaled integer back to a fixed-precision decimal string
 * (`1234, 2 -> "12.34"`).
 */
export function formatScaled(value: number, scale: number): string {
  const digits = String(Math.abs(value)).padStart(scale + 1, "0");
  const cut = digits.length - scale;
  const body = scale > 0 ? `${digits.slice(0, cut)}.${digits.slice(cut)}` : digits;
  return value < 0 ? `-${body}` : body;
}
