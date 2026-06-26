/**
 * Social media scheduling helper.
 * - Timezone: Europe/Rome
 * - Minutes rounded to multiples of 5
 * - Anti-collision: no two posts within +/-5 minutes
 */

const TZ = "Europe/Rome"

interface TimeWindow {
  start: string // "HH:mm"
  end: string   // "HH:mm"
}

interface TopicRule {
  frequency_days: number
  time_windows: TimeWindow[]
  exclude_weekdays: number[] // 0=Sun, 1=Mon, ...6=Sat
}

/**
 * Convert a Date to Europe/Rome local date parts.
 */
function toRomeParts(date: Date): { year: number; month: number; day: number; hours: number; minutes: number; weekday: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    weekday: "short",
    hour12: false,
  })
  const parts = formatter.formatToParts(date)
  const get = (type: string) => parts.find(p => p.type === type)?.value || "0"
  
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  
  return {
    year: Number.parseInt(get("year")),
    month: Number.parseInt(get("month")),
    day: Number.parseInt(get("day")),
    hours: Number.parseInt(get("hour")),
    minutes: Number.parseInt(get("minute")),
    weekday: weekdayMap[get("weekday")] ?? 0,
  }
}

/**
 * Create a Date from Europe/Rome local parts.
 */
function fromRomeParts(year: number, month: number, day: number, hours: number, minutes: number): Date {
  // Build an ISO string as if it were UTC, then adjust for Rome offset
  const isoStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`
  
  // Create a temp date to get the Rome offset at that moment
  const tempDate = new Date(isoStr + "Z")
  const romeStr = tempDate.toLocaleString("en-US", { timeZone: TZ })
  const romeDate = new Date(romeStr)
  const offsetMs = tempDate.getTime() - romeDate.getTime()
  
  // The actual UTC time = local Rome time + offset
  return new Date(tempDate.getTime() + offsetMs)
}

/**
 * Round minutes to the nearest multiple of 5.
 */
function roundTo5(minutes: number): number {
  return Math.round(minutes / 5) * 5
}

/**
 * Parse a "HH:mm" string into hours and minutes.
 */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [h, m] = timeStr.split(":").map(Number)
  return { hours: h, minutes: roundTo5(m) }
}

/**
 * Advance a date by N days in Europe/Rome, returning Rome parts.
 */
function advanceDaysRome(date: Date, days: number): Date {
  const result = new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
  return result
}

/**
 * Check if a weekday (0=Sun) is excluded.
 */
function isExcludedDay(weekday: number, excludeWeekdays: number[]): boolean {
  return excludeWeekdays.includes(weekday)
}

/**
 * Find the next valid day starting from baseDate, skipping excluded weekdays.
 */
function findNextValidDay(baseDate: Date, excludeWeekdays: number[]): Date {
  let current = baseDate
  for (let i = 0; i < 14; i++) { // Max 2 weeks ahead to find a valid day
    const parts = toRomeParts(current)
    if (!isExcludedDay(parts.weekday, excludeWeekdays)) {
      return current
    }
    current = advanceDaysRome(current, 1)
  }
  return current // Fallback: use the date as-is
}

/**
 * Generate a random time within a TimeWindow, with minutes as multiples of 5.
 * Returns { hours, minutes }.
 */
function randomTimeInWindow(window: TimeWindow): { hours: number; minutes: number } {
  const start = parseTime(window.start)
  const end = parseTime(window.end)
  
  const startMinutes = start.hours * 60 + start.minutes
  const endMinutes = end.hours * 60 + end.minutes
  
  // Generate random 5-min slot within the window
  const totalSlots = Math.floor((endMinutes - startMinutes) / 5)
  const randomSlot = Math.floor(Math.random() * (totalSlots + 1))
  const chosenMinutes = startMinutes + randomSlot * 5
  
  return {
    hours: Math.floor(chosenMinutes / 60),
    minutes: chosenMinutes % 60,
  }
}

/**
 * Check if a candidate time collides with any existing schedule (+/-5 min).
 */
function hasCollision(candidateUtc: Date, existingUtcTimes: Date[]): boolean {
  const candidateMs = candidateUtc.getTime()
  const threshold = 5 * 60 * 1000 // 5 minutes in ms
  
  return existingUtcTimes.some(existing => {
    return Math.abs(candidateMs - existing.getTime()) < threshold
  })
}

export interface ScheduleSlot {
  scheduledFor: Date // UTC Date
  romeTime: string   // Readable "YYYY-MM-DD HH:mm" in Europe/Rome
}

/**
 * Find the next available slot for a post, given a topic rule and existing schedules.
 * 
 * @param rule - The topic rule with frequency, time_windows, exclude_weekdays
 * @param lastScheduledFor - The last scheduled_for for this topic (UTC), or null for first post
 * @param existingSchedules - All existing scheduled_for dates (UTC) for anti-collision
 * @returns ScheduleSlot with the UTC date and Rome-readable string
 */
export function findNextAvailableSlot(
  rule: TopicRule,
  lastScheduledFor: Date | null,
  existingSchedules: Date[],
): ScheduleSlot {
  // Start from lastScheduledFor + frequency_days, or now + 1 day if first post
  const baseDate = lastScheduledFor
    ? advanceDaysRome(lastScheduledFor, rule.frequency_days)
    : advanceDaysRome(new Date(), 1)
  
  // Find next valid day (skip excluded weekdays)
  const validDay = findNextValidDay(baseDate, rule.exclude_weekdays)
  const dayParts = toRomeParts(validDay)
  
  // Shuffle time_windows to add variety
  const shuffledWindows = [...rule.time_windows].sort(() => Math.random() - 0.5)
  
  // Try each window, with anti-collision
  for (const window of shuffledWindows) {
    for (let attempt = 0; attempt < 20; attempt++) {
      const time = attempt === 0
        ? randomTimeInWindow(window)
        : { // On retries, shift forward by 5 min increments from start
          hours: Math.floor((parseTime(window.start).hours * 60 + parseTime(window.start).minutes + attempt * 5) / 60),
          minutes: (parseTime(window.start).hours * 60 + parseTime(window.start).minutes + attempt * 5) % 60,
        }
      
      // Don't exceed window end
      const endTime = parseTime(window.end)
      if (time.hours * 60 + time.minutes > endTime.hours * 60 + endTime.minutes) {
        break // This window is exhausted
      }
      
      const candidate = fromRomeParts(dayParts.year, dayParts.month, dayParts.day, time.hours, time.minutes)
      
      // Must be in the future
      if (candidate.getTime() <= Date.now()) {
        continue
      }
      
      if (!hasCollision(candidate, existingSchedules)) {
        const romeParts = toRomeParts(candidate)
        return {
          scheduledFor: candidate,
          romeTime: `${romeParts.year}-${String(romeParts.month).padStart(2, "0")}-${String(romeParts.day).padStart(2, "0")} ${String(romeParts.hours).padStart(2, "0")}:${String(romeParts.minutes).padStart(2, "0")}`,
        }
      }
      
      // Collision found, will retry with next attempt
    }
  }
  
  // If all windows exhausted on this day, try next valid day recursively
  const nextDay = findNextValidDay(advanceDaysRome(validDay, 1), rule.exclude_weekdays)
  return findNextAvailableSlot(
    { ...rule, frequency_days: 0 }, // frequency_days=0 since we already advanced
    nextDay,
    existingSchedules,
  )
}

/**
 * Generate scheduled_for dates for a batch of posts.
 * Each successive post uses the previous slot as the "lastScheduledFor" baseline.
 * 
 * @param rule - The topic rule
 * @param batchSize - Number of slots to generate
 * @param lastScheduledFor - Starting point (last existing scheduled post, or null)
 * @param existingSchedules - All existing scheduled_for dates for anti-collision
 * @returns Array of ScheduleSlots
 */
export function generateBatchSchedule(
  rule: TopicRule,
  batchSize: number,
  lastScheduledFor: Date | null,
  existingSchedules: Date[],
): ScheduleSlot[] {
  const slots: ScheduleSlot[] = []
  let lastSlot = lastScheduledFor
  const allSchedules = [...existingSchedules]
  
  for (let i = 0; i < batchSize; i++) {
    const slot = findNextAvailableSlot(rule, lastSlot, allSchedules)
    slots.push(slot)
    lastSlot = slot.scheduledFor
    allSchedules.push(slot.scheduledFor) // Add to collision check for next iteration
  }
  
  return slots
}
