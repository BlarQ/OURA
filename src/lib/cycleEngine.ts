import { CyclePrediction, MenstrualLog } from './types';

/**
 * Deterministically computes average cycle length, median cycle, and next period window.
 */
export function calculateCyclePrediction(logs: MenstrualLog[]): CyclePrediction {
  if (!logs || logs.length === 0) {
    const today = new Date();
    const estStart = new Date(today);
    estStart.setDate(today.getDate() + 7);
    const estEnd = new Date(estStart);
    estEnd.setDate(estStart.getDate() + 5);

    return {
      avgCycleLength: 28,
      avgPeriodDuration: 5,
      estimatedNextPeriodStart: estStart.toISOString().split('T')[0],
      estimatedNextPeriodEnd: estEnd.toISOString().split('T')[0],
      predictionWindowText: `Estimated between ${estStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${estEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    };
  }

  // Sort logs by start date ascending
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  let totalDuration = 0;
  sortedLogs.forEach((log) => {
    if (log.endDate) {
      const dur =
        (new Date(log.endDate).getTime() - new Date(log.startDate).getTime()) /
        (1000 * 3600 * 24) +
        1;
      totalDuration += dur > 0 ? dur : 5;
    } else {
      totalDuration += 5;
    }
  });

  const avgPeriodDuration = Math.round(totalDuration / sortedLogs.length);

  // Calculate cycle intervals between consecutive period starts
  const intervals: number[] = [];
  for (let i = 1; i < sortedLogs.length; i++) {
    const days =
      (new Date(sortedLogs[i].startDate).getTime() -
        new Date(sortedLogs[i - 1].startDate).getTime()) /
      (1000 * 3600 * 24);
    if (days >= 20 && days <= 45) {
      intervals.push(days);
    }
  }

  const avgCycleLength =
    intervals.length > 0
      ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
      : 28;

  const lastLog = sortedLogs[sortedLogs.length - 1];
  const lastStart = new Date(lastLog.startDate);

  const nextStart = new Date(lastStart);
  nextStart.setDate(lastStart.getDate() + avgCycleLength);

  const nextEnd = new Date(nextStart);
  nextEnd.setDate(nextStart.getDate() + avgPeriodDuration - 1);

  const formatWindow = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return {
    avgCycleLength,
    avgPeriodDuration,
    estimatedNextPeriodStart: nextStart.toISOString().split('T')[0],
    estimatedNextPeriodEnd: nextEnd.toISOString().split('T')[0],
    predictionWindowText: `Estimated between ${formatWindow(nextStart)} – ${formatWindow(nextEnd)}`
  };
}
