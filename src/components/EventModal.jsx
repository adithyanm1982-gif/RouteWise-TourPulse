import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { CATEGORIES, PLACES, useAppStore } from '../store/useAppStore';

const local = (ms) => format(ms, "yyyy-MM-dd'T'HH:mm");
const field = 'w-full rounded-lg border border-slate-300 dark:border-white/15 bg-transparent px-3 py-2 text-sm';

export default function EventModal({ onClose }) {
  const addEvent = useAppStore((s) => s.addEvent);
  const [f, setF] = useState({ title: '', category: CATEGORIES[1], start: local(Date.now() + 9 * 3600000), deadline: '', durationMin: 45, destName: PLACES.rose.name, lat: PLACES.rose.lat, lng: PLACES.rose.lng });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const ok = f.title.trim() && f.start && !isNaN(+f.lat) && !isNaN(+f.lng);
  const submit = () => { addEvent(f); onClose(); };

  return (
    <motion.div className="fixed inset-0 z-[2000] bg-black/50 grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-panel p-5 border border-slate-200 dark:border-white/10 space-y-3">
        <div className="flex items-center justify-between"><h2 className="font-bold text-lg">New event</h2><button aria-label="Close" onClick={onClose}><X size={18} /></button></div>
        <label className="block text-xs font-semibold">Title<input className={field} value={f.title} onChange={set('title')} placeholder="Safari slot at Mudumalai" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold">Category<select className={field} value={f.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="text-xs font-semibold">Duration (min)<input type="number" className={field} value={f.durationMin} onChange={set('durationMin')} /></label>
          <label className="text-xs font-semibold">Start time<input type="datetime-local" className={field} value={f.start} onChange={set('start')} /></label>
          <label className="text-xs font-semibold">Arrival deadline<input type="datetime-local" className={field} value={f.deadline} onChange={set('deadline')} /></label>
        </div>
        <label className="block text-xs font-semibold">Destination name<input className={field} value={f.destName} onChange={set('destName')} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold">Latitude<input className={field} value={f.lat} onChange={set('lat')} /></label>
          <label className="text-xs font-semibold">Longitude<input className={field} value={f.lng} onChange={set('lng')} /></label>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Leave the deadline empty to arrive by the start time. Baseline travel time is estimated from distance.</p>
        <button disabled={!ok} onClick={submit} className="w-full rounded-lg py-2.5 font-bold bg-route text-ink disabled:opacity-40">Add event</button>
      </motion.div>
    </motion.div>
  );
}
