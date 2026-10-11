import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAppStore, useVisible } from '../store/useAppStore';
import { calculateDepartureTime, findConflicts } from '../utils/algorithms';
import { clock, countdown } from '../utils/time';
import MapComponent from '../components/MapComponent';
import EventCard from '../components/EventCard';

export default function DashboardView() {
  const { events, incidents } = useVisible();
  const { now, offline, booting, selectedId, select } = useAppStore();
  const conflicts = useMemo(() => findConflicts(events), [events]);
  const upcoming = events.filter((e) => e.arriveBy > now).sort((a, b) => calculateDepartureTime(a.arriveBy, a.liveTravel) - calculateDepartureTime(b.arriveBy, b.liveTravel));
  const next = upcoming[0];
  const issues = Object.entries(conflicts).filter(([, c]) => c.conflict);

  if (booting) return (
    <div className="grid lg:grid-cols-3 gap-4 animate-pulse">
      <div className="lg:col-span-2 h-[560px] rounded-2xl bg-slate-300/50 dark:bg-white/5" />
      <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-40 rounded-2xl bg-slate-300/50 dark:bg-white/5" />)}</div>
    </div>
  );

  return (
    <div className="grid xl:grid-cols-3 gap-4">
      <MapComponent className="xl:col-span-2 h-[460px] xl:h-[calc(100vh-7.5rem)]" events={events} incidents={incidents} selectedId={selectedId} onSelect={select} offline={offline} />
      <div className="space-y-4 xl:max-h-[calc(100vh-7.5rem)] xl:overflow-auto pr-1">
        {next ? (
          <section className="glass rounded-2xl p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">Next departure: {next.title}</p>
            <p className="text-5xl font-extrabold mt-1">{calculateDepartureTime(next.arriveBy, next.liveTravel) <= now ? 'Leave now' : countdown(calculateDepartureTime(next.arriveBy, next.liveTravel) - now)}</p>
            <p className="text-sm mt-2 text-slate-600 dark:text-slate-300">
              Depart at <b>{clock(calculateDepartureTime(next.arriveBy, next.liveTravel))}</b> = {clock(next.arriveBy)} - {next.liveTravel} min live travel.
            </p>
          </section>
        ) : <section className="glass rounded-2xl p-5 text-sm">Nothing upcoming. Add an event in the Itinerary Planner.</section>}

        {issues.map(([id, c]) => (
          <div key={id} className="rounded-2xl bg-alarm/15 text-rose-600 dark:text-rose-300 p-4 text-sm flex gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span><b>Schedule risk: {c.deficitMin} min deficit.</b> {events.find((e) => e.id === id)?.title} will be reached at {clock(c.estimatedArrival)}.</span>
          </div>
        ))}

        {upcoming.map((e) => <EventCard key={e.id} ev={e} conflict={conflicts[e.id]} selected={selectedId === e.id} onSelect={select} />)}
      </div>
    </div>
  );
}
