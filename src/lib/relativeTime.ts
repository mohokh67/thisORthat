const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/**
 * A compact "time since" label for a log entry: "just now", then "Nm ago",
 * "Nh ago", "Nd ago". `now` is passed in (epoch ms) so the function stays pure
 * and testable. An unparseable or future timestamp reads as "just now".
 */
export function relativeTime(iso: string, now: number): string {
  const seconds = Math.round((now - Date.parse(iso)) / 1000)
  if (!Number.isFinite(seconds) || seconds < 45) {
    return 'just now'
  }
  if (seconds < HOUR) {
    return `${Math.round(seconds / MINUTE)}m ago`
  }
  if (seconds < DAY) {
    return `${Math.round(seconds / HOUR)}h ago`
  }
  return `${Math.round(seconds / DAY)}d ago`
}
