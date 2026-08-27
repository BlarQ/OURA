import { DutyDay, DutyScheduleSetup } from './types';

// Duty cycle pattern: 2 Morning -> 2 Night -> 2 OFF (6 days total)
const DUTY_CYCLE: Array<'Morning' | 'Night' | 'OFF'> = [
  'Morning',
  'Morning',
  'Night',
  'Night',
  'OFF',
  'OFF'
];

/**
 * Calculates duty schedule array starting from setup's day1Date for N days.
 * Returns empty array if duty rotation is not configured yet.
 */
export function calculateDutyDays(
  setup: DutyScheduleSetup,
  startDateStr: string,
  daysCount: number = 30,
  husbandWfhDays: string[] = ['Tuesday']
): DutyDay[] {
  // If not configured by user, return empty list (no dummy pre-calculated dates!)
  if (!setup || !setup.isConfigured) {
    return [];
  }

  const baseDate = new Date(setup.day1Date || startDateStr);
  const targetStart = new Date(startDateStr);

  // Determine starting index in the 6-day cycle from user's day1Type
  let startIdx = 0;
  if (setup.day1Type === 'Night') startIdx = 2;
  else if (setup.day1Type === 'OFF') startIdx = 4;

  const result: DutyDay[] = [];

  for (let i = 0; i < daysCount; i++) {
    const currDate = new Date(targetStart);
    currDate.setDate(targetStart.getDate() + i);

    const currDateStr = currDate.toISOString().split('T')[0];

    // Days difference from baseDate
    const diffTime = currDate.getTime() - baseDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));

    // Calculate duty type index in 6-day cycle
    let cycleIdx = (startIdx + diffDays) % 6;
    if (cycleIdx < 0) cycleIdx += 6;

    const dutyType = DUTY_CYCLE[cycleIdx];

    // Check day of week
    const dayOfWeekName = currDate.toLocaleDateString('en-US', { weekday: 'long' });
    const isWeekend = dayOfWeekName === 'Saturday' || dayOfWeekName === 'Sunday';

    // Home Weekend check: Off duty on both Saturday & Sunday
    const isHomeWeekend = dutyType === 'OFF' && isWeekend;

    // Husband WFH check: Off duty on configured WFH day (e.g., Tuesday)
    const isHusbandWfh = dutyType === 'OFF' && husbandWfhDays.includes(dayOfWeekName);

    result.push({
      date: currDateStr,
      dutyType,
      isHomeWeekend,
      isHusbandWfh
    });
  }

  return result;
}

export function getDutySummaryText(duty?: DutyDay, wifeName: string = 'Wife'): string {
  if (!duty) {
    return 'Shift rotation not configured yet. Configure your 2-day baseline above!';
  }

  if (duty.dutyType === 'Morning') {
    return `${wifeName} has Morning Duty today.`;
  } else if (duty.dutyType === 'Night') {
    return `${wifeName} has Night Duty tonight. Light portable meals recommended.`;
  } else {
    if (duty.isHomeWeekend) {
      return `🌟 HOME WEEKEND! You have Saturday & Sunday OFF. Perfect time to relax together at home.`;
    } else if (duty.isHusbandWfh) {
      return `🏠 Husband is Working From Home today during your day off!`;
    } else {
      return `${wifeName} is OFF duty today. Rest & recharge!`;
    }
  }
}
