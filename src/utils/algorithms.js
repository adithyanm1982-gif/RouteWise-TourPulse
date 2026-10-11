// Pure functions. No React, no store: this is the "backend worker" math.
export const MIN = 60000;

/** Algorithm A: Departure = Event start - Live travel time. Returns epoch ms. */
export function calculateDepartureTime(eventStartTime, liveTravelTime) {
  return eventStartTime - liveTravelTime * MIN;
}

/** Algorithm B: alert only if |T_new - T_base| >= threshold (minutes). */
export function evaluateMaterialChange(baselineTime, newTime, thresholdMinutes) {
  const delta = newTime - baselineTime;
  const absDelta = Math.abs(delta);
  return {
    shouldNotify: absDelta >= thresholdMinutes,
    delta,
    absDelta,
    direction: delta > 0 ? 'slower' : delta < 0 ? 'faster' : 'unchanged',
  };
}

/** Urgent override: must leave now (bypasses the threshold). */
export function isUrgent(eventStartTime, liveTravelTime, now) {
  return now < eventStartTime && calculateDepartureTime(eventStartTime, liveTravelTime) <= now;
}

/** Algorithm C: Estimated arrival at B = End of A + transit. Conflict if later than B's start. */
export function checkScheduleConflicts(eventAEnd, eventBStart, transitTime) {
  const estimatedArrival = eventAEnd + transitTime * MIN;
  const diffMin = Math.ceil((estimatedArrival - eventBStart) / MIN);
  return {
    conflict: diffMin > 0,
    deficitMin: Math.max(0, diffMin),
    slackMin: Math.max(0, -diffMin),
    estimatedArrival,
  };
}

/** Run Algorithm C across the itinerary chain (commutes are independent). Returns { [eventBId]: result }. */
export function findConflicts(events) {
  const chain = events.filter((e) => e.category !== 'Commute').sort((a, b) => a.arriveBy - b.arriveBy);
  const out = {};
  for (let i = 1; i < chain.length; i++) {
    const a = chain[i - 1], b = chain[i];
    out[b.id] = { ...checkScheduleConflicts(a.start + a.durationMin * MIN, b.arriveBy, b.liveTravel), prevTitle: a.title };
  }
  return out;
}

/** Sliding-window polling: every 30 min when far, down to every 3 min near departure. */
export function getPollIntervalMinutes(minutesToDeparture) {
  if (minutesToDeparture >= 240) return 30;
  if (minutesToDeparture >= 120) return 20;
  if (minutesToDeparture >= 60) return 10;
  if (minutesToDeparture >= 30) return 6;
  return 3;
}

export function haversineKm(a, b) {
  const R = 6371, r = (d) => (d * Math.PI) / 180;
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
