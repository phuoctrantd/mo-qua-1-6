/** Vietnam (UTC+7). Test: 30 May 2026 12:30. Production: 31 May 2026 00:00. */
export const LAUNCH_AT = new Date("2026-05-31T00:00:00+07:00");

export function isLaunchBypassed(): boolean {
  return process.env.LAUNCH_BYPASS === "true";
}

export function isBeforeLaunch(now = new Date()): boolean {
  if (isLaunchBypassed()) return false;
  return now.getTime() < LAUNCH_AT.getTime();
}
