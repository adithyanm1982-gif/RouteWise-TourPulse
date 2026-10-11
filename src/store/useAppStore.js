import { create } from 'zustand';
import {
  MIN, calculateDepartureTime, evaluateMaterialChange, isUrgent, getPollIntervalMinutes, haversineKm,
} from '../utils/algorithms';
import { clock } from '../utils/time';

const uid = () => Math.random().toString(36).slice(2, 8);
const ORIGIN = { name: 'Mettupalayam Station', lat: 11.2993, lng: 76.9375 };
export const PLACES = {
  coonoorBus: { name: 'Coonoor Bus Stand', lat: 11.3445, lng: 76.7954 },
  simsPark: { name: "Sim's Park, Coonoor", lat: 11.353, lng: 76.7959 },
  rose: { name: 'Rose Garden, Ooty', lat: 11.4102, lng: 76.705 },
  hotel: { name: 'Lakeview Hotel, Ooty', lat: 11.4064, lng: 76.6932 },
  college: { name: 'Govt Arts College, Ooty', lat: 11.4075, lng: 76.7101 },
};
export const CATEGORIES = ['Commute', 'Pre-Booked Slot', 'Hotel Check-in'];

const mkRoute = (a, b) => [[a.lat, a.lng], [(a.lat + b.lat) / 2 + 0.012, (a.lng + b.lng) / 2 - 0.01], [b.lat, b.lng]];
const mkEvent = (o) => ({
  id: uid(), durationMin: 0, urgentFired: false, nextPollAt: 0, lastPolledAt: null, lastReason: null,
  liveTravel: o.baseTravel, lastAlertTravel: o.baseTravel, route: mkRoute(o.from, o.to), arriveBy: o.start, ...o,
});

export const INCIDENTS = {
  rockfall: { label: 'unexpected rockfall', short: 'Rockfall', road: 'Ghat Road NH-181', delay: 28, queueKm: 3.2, target: 2, why: 'Boulders on two lanes; one-way alternating traffic.' },
  construction: { label: 'emergency road construction', short: 'Construction', road: 'Ooty-Coonoor Rd', delay: 18, queueKm: 1.8, target: 3, why: 'Surface repair crew closed the uphill lane.' },
  accident: { label: 'a minor vehicle collision', short: 'Accident', road: 'Coonoor Bypass', delay: 6, queueKm: 0.4, target: 0, why: 'Single-lane slowdown, clearing quickly.' },
  landslide: { label: 'a landslide', short: 'Landslide', road: 'Kallar-Coonoor Ghat', delay: 35, queueKm: 4.6, target: 1, why: 'Debris across the full carriageway; diversion in effect.' },
};

const seed = () => {
  const t = Date.now(), at = (m) => t + m * MIN;
  return [
    mkEvent({ title: 'Daily commute to college', category: 'Commute', from: PLACES.coonoorBus, to: PLACES.college, start: at(100), baseTravel: 38 }),
    mkEvent({ title: "Pre-booked slot: Sim's Park", category: 'Pre-Booked Slot', from: ORIGIN, to: PLACES.simsPark, start: at(150), durationMin: 60, baseTravel: 55 }),
    mkEvent({ title: 'Rose Garden guided tour', category: 'Pre-Booked Slot', from: PLACES.simsPark, to: PLACES.rose, start: at(260), durationMin: 60, baseTravel: 40 }),
    mkEvent({ title: 'Lakeview hotel check-in', category: 'Hotel Check-in', from: PLACES.rose, to: PLACES.hotel, start: at(420), baseTravel: 15 }),
  ];
};
const fresh = () => ({
  events: seed(), incidents: [], logs: [], notifications: [], now: Date.now(),
  vault: { events: [], incidents: [], syncedAt: null },
});

export const useAppStore = create((set, get) => {
  const log = (entry) => set((s) => ({ logs: [{ id: uid(), ts: Date.now(), ...entry }, ...s.logs].slice(0, 80) }));
  const notify = (n) => set((s) => ({ notifications: [{ id: uid(), ts: Date.now(), read: false, ...n }, ...s.notifications].slice(0, 40) }));
  const patch = (id, p) => set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...p } : e)) }));

  // BACKEND LOGIC: material-change evaluation + explainable log. Runs for every new travel-time reading.
  const applyUpdate = (id, newTravel, reasonPrefix) => {
    const s = get(), ev = s.events.find((e) => e.id === id);
    if (!ev || newTravel === ev.liveTravel) return;
    const now = Date.now();
    const oldDep = calculateDepartureTime(ev.arriveBy, ev.liveTravel);
    const newDep = calculateDepartureTime(ev.arriveBy, newTravel);
    const shift = Math.round((oldDep - newDep) / MIN);
    const chg = evaluateMaterialChange(ev.baseTravel, newTravel, s.threshold);
    const urgent = isUrgent(ev.arriveBy, newTravel, now);
    const fire = chg.shouldNotify || urgent;
    const moved = shift === 0 ? 'Departure unchanged.' : `Departure shifted ${Math.abs(shift)} min ${shift > 0 ? 'earlier' : 'later'} to ${clock(newDep)}.`;
    const rule = fire
      ? `Change of ${chg.absDelta} min vs baseline meets your ${s.threshold}-min threshold.`
      : `Change of ${chg.absDelta} min vs baseline is below your ${s.threshold}-min threshold, so no alert was sent.`;
    const text = `${reasonPrefix} ${moved} ${rule}`;
    log({ kind: urgent ? 'urgent' : fire ? 'alert' : 'suppressed', eventId: id, title: ev.title, text, delta: chg.delta });
    if (fire) notify({ severity: urgent ? 'urgent' : 'alert', title: urgent ? `Leave now: ${ev.title}` : `${ev.title}: ${chg.delta > 0 ? '+' : ''}${chg.delta} min`, text });
    patch(id, { liveTravel: newTravel, lastReason: reasonPrefix, lastAlertTravel: fire ? newTravel : ev.lastAlertTravel, urgentFired: urgent });
  };

  const pollEvent = (id) => {
    const s = get(), ev = s.events.find((e) => e.id === id);
    if (!ev) return;
    const delays = s.incidents.filter((i) => i.active && i.eventId === id).reduce((a, i) => a + i.delay, 0);
    const drift = Math.floor(Math.random() * 3) - 1;
    const now = Date.now();
    const interval = getPollIntervalMinutes((calculateDepartureTime(ev.arriveBy, ev.liveTravel) - now) / MIN);
    patch(id, { lastPolledAt: now, nextPollAt: now + interval * MIN });
    const newTravel = Math.max(5, ev.baseTravel + delays + drift);
    // Tiny background wobble (under 2 min) is applied silently so the log only shows meaningful changes.
    if (Math.abs(newTravel - ev.liveTravel) < 2) patch(id, { liveTravel: newTravel });
    else applyUpdate(id, newTravel, 'Routine satellite traffic poll.');
  };

  return {
    ...fresh(), threshold: 10, offline: false, theme: 'dark', booting: true, selectedId: null,

    // FRONTEND actions
    setTheme: (theme) => set({ theme }),
    setThreshold: (threshold) => set({ threshold }),
    select: (selectedId) => set({ selectedId }),
    markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
    removeEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),
    addEvent: (f) => {
      const to = { name: f.destName || 'Custom destination', lat: +f.lat, lng: +f.lng };
      const start = new Date(f.start).getTime();
      const arriveBy = f.deadline ? Math.min(new Date(f.deadline).getTime(), start) : start;
      const baseTravel = Math.max(5, Math.round((haversineKm(ORIGIN, to) / 28) * 60));
      set((s) => ({ events: [...s.events, mkEvent({ title: f.title, category: f.category, from: ORIGIN, to, start, arriveBy, durationMin: +f.durationMin || 0, baseTravel })] }));
    },
    setOffline: (offline) => {
      const s = get();
      if (offline) set({ offline, vault: { events: JSON.parse(JSON.stringify(s.events)), incidents: JSON.parse(JSON.stringify(s.incidents)), syncedAt: Date.now() } });
      else set({ offline, events: s.events.map((e) => ({ ...e, nextPollAt: 0 })) });
      log({ kind: 'info', title: offline ? 'Offline vault active' : 'Back online', text: offline ? 'Cell coverage lost. Showing the itinerary cached at last sync; countdowns still run on-device, satellite polling is paused.' : 'Connection restored. Satellite polling resumes and the itinerary re-syncs.' });
    },
    resetDemo: () => set({ ...fresh(), offline: false, selectedId: null }),

    // BACKEND WORKER: called once per second by App.
    tick: () => {
      const now = Date.now();
      set({ now });
      const s = get();
      s.events.forEach((ev) => {
        if (now >= ev.arriveBy) return;
        if (isUrgent(ev.arriveBy, ev.liveTravel, now) && !ev.urgentFired) {
          patch(ev.id, { urgentFired: true });
          const text = `Latest travel time is ${ev.liveTravel} min, so you must depart now to arrive by ${clock(ev.arriveBy)}. Threshold rule bypassed.`;
          log({ kind: 'urgent', eventId: ev.id, title: ev.title, text });
          notify({ severity: 'urgent', title: `Leave now: ${ev.title}`, text });
        }
        if (!s.offline && now >= ev.nextPollAt) pollEvent(ev.id);
      });
    },
    pollNow: () => { if (!get().offline) get().events.forEach((e) => Date.now() < e.arriveBy && pollEvent(e.id)); },

    // Simulated satellite-verified incident -> instantly runs Algorithms A, B, C.
    simulateIncident: (key) => {
      const s = get(), tpl = INCIDENTS[key];
      if (s.offline) return;
      const upcoming = s.events.filter((e) => e.arriveBy > Date.now());
      const ev = upcoming.find((e) => e.id === s.events[tpl.target]?.id) || upcoming[0];
      if (!ev) return;
      const mid = ev.route[1];
      const incident = { id: uid(), type: key, label: tpl.label, short: tpl.short, road: tpl.road, delay: tpl.delay, queueKm: tpl.queueKm, why: tpl.why, lat: mid[0], lng: mid[1], eventId: ev.id, active: true, verifiedAt: Date.now() };
      set((st) => ({ incidents: [incident, ...st.incidents] }));
      applyUpdate(ev.id, ev.liveTravel + tpl.delay, `Satellite imagery confirms a ${tpl.queueKm} km queue on ${tpl.road} due to ${tpl.label}.`);
    },
    resolveIncident: (id) => {
      const s = get(), inc = s.incidents.find((i) => i.id === id);
      if (!inc || s.offline) return;
      set((st) => ({ incidents: st.incidents.map((i) => (i.id === id ? { ...i, active: false } : i)) }));
      const ev = s.events.find((e) => e.id === inc.eventId);
      if (ev) applyUpdate(ev.id, Math.max(5, ev.liveTravel - inc.delay), `Satellite feed shows ${inc.label} on ${inc.road} has cleared.`);
    },
  };
});

/** What the UI should render: live data online, the cached vault snapshot offline. */
export const useVisible = () => useAppStore((s) => (s.offline ? s.vault : s));

setTimeout(() => useAppStore.setState({ booting: false }), 900);
