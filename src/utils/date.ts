const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Accepts Unix timestamps in seconds (10 digits) or milliseconds (13 digits). */
const toMilliseconds = (timestamp: number): number =>
  timestamp < 1e12 ? timestamp * 1000 : timestamp;

/** Returns the [start, end) range of the UTC calendar day containing the timestamp. */
export const getUtcDayRange = (timestamp: number): { start: Date; end: Date } => {
  const date = new Date(toMilliseconds(timestamp));
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const end = new Date(start.getTime() + MS_PER_DAY);
  return { start, end };
};
