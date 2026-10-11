import { Cpu, Zap, CheckCheck, RefreshCw } from 'lucide-react';
import { useAppStore, useVisible, INCIDENTS } from '../store/useAppStore';
import { calculateDepartureTime, getPollIntervalMinutes, MIN } from '../utils/algorithms';
import { countdown } from '../utils/time';
import Tip from './Tip';

export default function Sidebar() {
  const { events } = useVisible();
  const { now, offline, simulateIncident, pollNow, incidents, resolveIncident } = useAppStore();
  const upcoming = events.filter((e) => e.arriveBy > now);
  const active = incidents.filter((i) => i.active);

  return (
    <aside className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
      <section className="glass rounded-2xl p-4">
        <h2 className="font-bold flex items-center gap-2 text-sm"><Cpu size={15} /> Backend worker
          <span className={`ml-auto text-xs ${offline ? 'text-slate-500' : 'text-route'}`}>{offline ? 'Paused' : 'Running'}</span></h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Polls each route more often as departure nears.</p>
        <ul className="mt-3 space-y-2.5">
          {upcoming.map((e) => {
            const dep = calculateDepartureTime(e.arriveBy, e.liveTravel);
            const every = getPollIntervalMinutes((dep - now) / MIN);
            return (
              <li key={e.id} className="text-xs">
                <p className="font-semibold truncate">{e.title}</p>
                <p className="text-slate-500 dark:text-slate-400">Every {every} min, next in {offline ? 'paused' : countdown(Math.max(0, e.nextPollAt - now)).slice(3)}</p>
              </li>
            );
          })}
          {upcoming.length === 0 && <li className="text-xs text-slate-500">No upcoming events to watch.</li>}
        </ul>
        <button disabled={offline} onClick={pollNow} className="mt-3 w-full text-xs font-semibold rounded-lg py-2 border border-slate-300 dark:border-white/15 disabled:opacity-40 flex items-center justify-center gap-1.5">
          <RefreshCw size={13} /> Poll satellite feed now
        </button>
      </section>

      <section className="glass rounded-2xl p-4">
        <h2 className="font-bold flex items-center gap-2 text-sm"><Zap size={15} /> Simulate disruption</h2>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {Object.entries(INCIDENTS).map(([k, v]) => (
            <Tip key={k} text={`${v.why} Adds about ${v.delay} min to one of your routes.`}>
              <button disabled={offline} onClick={() => simulateIncident(k)}
                className="w-full text-xs font-semibold rounded-lg py-2 bg-signal/15 text-amber-700 dark:text-amber-300 hover:bg-signal/25 disabled:opacity-40">
                {v.short} +{v.delay}
              </button>
            </Tip>
          ))}
        </div>
        {offline && <p className="text-xs text-slate-500 mt-2">No signal: the feed can't be reached from the vault.</p>}
        {active.length > 0 && (
          <button onClick={() => active.forEach((i) => resolveIncident(i.id))} className="mt-3 w-full text-xs font-semibold rounded-lg py-2 border border-slate-300 dark:border-white/15 flex items-center justify-center gap-1.5">
            <CheckCheck size={13} /> Clear all {active.length} incidents
          </button>
        )}
      </section>
    </aside>
  );
}
