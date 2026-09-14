/** Parse durations like `15m`, `1h`, `7d`, `30s` into milliseconds. */
export function parseDurationToMs(
  value: string | undefined,
  fallbackMs: number,
): number {
  if (!value?.trim()) return fallbackMs;
  const match = value.trim().match(/^(\d+)(ms|s|m|h|d)$/i);
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return amount * (multipliers[unit] ?? fallbackMs);
}
