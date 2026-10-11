import { useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useAppStore, useVisible } from '../store/useAppStore';
import { findConflicts } from '../utils/algorithms';
import EventCard from '../components/EventCard';
import EventModal from '../components/EventModal';

export default function ItineraryView() {
  const { events } = useVisible();
  const { offline, removeEvent, selectedId, select, vault } = useAppStore();
  const [open, setOpen] = useState(false);
  const conflicts = useMemo(() => findConflicts(events), [events]);
  const sorted = [...events].sort((a, b) => a.arriveBy - b.arriveBy);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Itinerary planner</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Every departure time is worked backward from your arrival deadline.</p>
        </div>
        <button disabled={offline} onClick={() => setOpen(true)} className="ml-auto flex items-center gap-1.5 rounded-lg bg-route text-ink font-bold text-sm px-4 py-2 disabled:opacity-40"><Plus size={16} />New event</button>
      </div>
      {offline && <p className="rounded-xl bg-signal/15 text-amber-700 dark:text-amber-300 text-sm p-3">You're viewing the offline vault, saved at {new Date(vault.syncedAt).toLocaleTimeString()}. Editing is disabled until you reconnect.</p>}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((e) => <EventCard key={e.id} ev={e} conflict={conflicts[e.id]} selected={selectedId === e.id} onSelect={select} onRemove={offline ? undefined : removeEvent} />)}
      </div>
      {sorted.length === 0 && <p className="glass rounded-2xl p-8 text-center text-sm">No events yet. Add your first commute or booked slot.</p>}
      <AnimatePresence>{open && <EventModal onClose={() => setOpen(false)} />}</AnimatePresence>
    </div>
  );
}
