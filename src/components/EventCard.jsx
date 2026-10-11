import { Clock, Trash2, AlertTriangle, Info, Navigation } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { calculateDepartureTime } from '../utils/algorithms';
import { clock, countdown } from '../utils/time';
import Tip from './Tip';

export default function EventCard({ ev, conflict, selected, onSelect, onRemove }) {
  const now = useAppStore((s) => s.now);
  const threshold = useAppStore((s) => s.threshold);
  const dep = calculateDepartureTime(ev.arriveBy, ev.liveTravel);
  const baseDep = calculateDepartureTime(ev.arriveBy, ev.baseTravel);
  const delta = ev.liveTravel - ev.baseTravel;
  const past = now >= ev.arriveBy;
  const leaveNow = !past && dep <= now;
  const material = Math.abs(delta) >= threshold;

  return (
    <div onClick={() => onSelect?.(ev.id)}
      className={`glass rounded-2xl p-4 cursor-pointer transition ${selected ? 'ring-2 ring-route' : ''} ${past ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-route">{ev.category}</p>
          <h3 className="font-bold truncate">{ev.title}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
            <Navigation size={12} /> {ev.from.name} to {ev.to.name}
          </p>
        </div>
        {onRemove && (
          <button aria-label="Remove event" onClick={(e) => { e.stopPropagation(); onRemove(ev.id); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-alarm hover:bg-alarm/10"><Trash2 size={15} /></button>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{leaveNow ? 'Leave now' : past ? 'Event started' : 'Leave in'}</p>
          <p className={`text-2xl font-extrabold ${leaveNow ? 'text-alarm' : ''}`}>{past ? '--' : leaveNow ? 'NOW' : countdown(dep - now)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Arrive by</p>
          <p className="text-2xl font-extrabold flex items-center gap-1.5"><Clock size={16} className="text-slate-400" />{clock(ev.arriveBy)}</p>
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Depart = {clock(ev.arriveBy)} - {ev.liveTravel} min = <b className="text-slate-800 dark:text-slate-100">{clock(dep)}</b>
        {delta !== 0 && <span className="line-through ml-2">{clock(baseDep)}</span>}
      </p>

      {delta !== 0 && (
        <div className={`mt-3 rounded-xl p-2.5 text-xs flex gap-2 ${material ? 'bg-signal/15 text-amber-700 dark:text-amber-300' : 'bg-slate-500/10 text-slate-600 dark:text-slate-300'}`}>
          <Tip text={`Material-change rule: |${ev.liveTravel} - ${ev.baseTravel}| = ${Math.abs(delta)} min against your ${threshold}-min threshold. ${material ? 'It triggers an alert.' : 'It stays quiet.'}`}>
            <Info size={14} className="mt-0.5 shrink-0" />
          </Tip>
          <span><b>{delta > 0 ? '+' : ''}{delta} min</b> ({ev.baseTravel} to {ev.liveTravel}). {ev.lastReason}</span>
        </div>
      )}

      {conflict?.conflict && (
        <div className="mt-3 rounded-xl p-2.5 text-xs flex gap-2 bg-alarm/15 text-rose-600 dark:text-rose-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span><b>Schedule conflict: {conflict.deficitMin} min short.</b> After "{conflict.prevTitle}" you reach this stop at {clock(conflict.estimatedArrival)}, past {clock(ev.arriveBy)}.</span>
        </div>
      )}
      {conflict && !conflict.conflict && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{conflict.slackMin} min of slack after "{conflict.prevTitle}".</p>
      )}
    </div>
  );
}
