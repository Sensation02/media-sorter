const BYTES_PER_KB = 1024;
const FRACTION_DIGITS = 1;
const UNITS = ["B", "KB", "MB", "GB", "TB", "PB"] as const;
const BASE_UNIT_INDEX = 0;
const FIRST_DECIMAL_UNIT_INDEX = 1;
const ZERO_BYTES_LABEL = "0 B";
const UNKNOWN_LABEL = "—";

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return UNKNOWN_LABEL;
  }

  if (bytes === 0) {
    return ZERO_BYTES_LABEL;
  }

  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(BYTES_PER_KB)), UNITS.length - 1);
  const value = bytes / Math.pow(BYTES_PER_KB, exponent);
  const digits = exponent >= FIRST_DECIMAL_UNIT_INDEX ? FRACTION_DIGITS : BASE_UNIT_INDEX;

  return `${value.toFixed(digits)} ${UNITS[exponent]}`;
}
