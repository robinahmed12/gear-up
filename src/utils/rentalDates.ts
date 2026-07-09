const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Whole rental days between two dates, rounded up and floored at 1 —
 * a same-day rental still bills for one day, and any partial day (e.g.
 * pick up at 10am, return at 10am two days later) rounds in the
 * customer's favor of clarity, not the platform's favor of revenue,
 * since that's the simpler rule to state up front.
 */
export const calculateTotalDays = (startDate: Date, endDate: Date): number => {
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.max(1, Math.ceil(diffMs / MS_PER_DAY));
};
