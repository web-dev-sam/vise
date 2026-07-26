import { describe, expect, it } from "vitest";
import { formatScaled, parseScaled } from "../src/shared/lib/decimal";

describe("parseScaled", () => {
  it("parses a decimal string to a scaled integer", () => {
    expect(parseScaled("125.00", 2)).toBe(12_500);
    expect(parseScaled("8.75", 2)).toBe(875);
    expect(parseScaled("0.05", 2)).toBe(5);
  });

  it("pads a short or missing fraction out to the scale", () => {
    expect(parseScaled("12.5", 2)).toBe(1250);
    expect(parseScaled("12", 2)).toBe(1200);
    expect(parseScaled("12", 0)).toBe(12);
  });

  it("truncates fractional digits beyond the scale", () => {
    expect(parseScaled("12.999", 2)).toBe(1299);
  });

  it("handles negatives and a leading dot", () => {
    expect(parseScaled("-12.34", 2)).toBe(-1234);
    expect(parseScaled(".5", 2)).toBe(50);
  });

  it("throws on non-numeric input instead of yielding NaN", () => {
    expect(() => parseScaled("nope", 2)).toThrow();
    expect(() => parseScaled("", 2)).toThrow();
    expect(() => parseScaled("1.2.3", 2)).toThrow();
  });
});

describe("formatScaled", () => {
  it("formats a scaled integer to a fixed-precision string", () => {
    expect(formatScaled(12_500, 2)).toBe("125.00");
    expect(formatScaled(875, 2)).toBe("8.75");
    expect(formatScaled(5, 2)).toBe("0.05");
    expect(formatScaled(0, 2)).toBe("0.00");
  });

  it("formats negatives and a zero scale", () => {
    expect(formatScaled(-1234, 2)).toBe("-12.34");
    expect(formatScaled(1234, 0)).toBe("1234");
  });

  it("round-trips with parseScaled", () => {
    for (const value of ["0.00", "8.75", "125.00", "9999.99"]) {
      expect(formatScaled(parseScaled(value, 2), 2)).toBe(value);
    }
  });
});
