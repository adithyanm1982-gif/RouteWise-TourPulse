import { CheckCircle2, BellOff, BellRing, Siren, Info } from 'lucide-react';
import { useAppStore, useVisible } from '../store/useAppStore';
import { clock } from '../utils/time';
import Tip from '../components/Tip';

const KIND = {
  alert: { icon: BellRing, cls: 'text-signal', label: 'Alert sent' },
  urgent: { icon: Siren, cls: 'text-alarm', label: 'Urgent override' },
  suppressed: { icon: BellOff, cls: 'text-slate-400', label: 'Suppressed' },
  info: { icon: Info, cls: 'text-route', label: 'System' },
};

export default function DisruptionRadarView() {
  const { incidents } = useVisible();
  const { threshold, setThreshold, logs, offline, resolveIncident } = useAppStore();
  const count = (k) => logs.filter((l) => l.kind === k).length;

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="space-y-4">
        <section className="glass rounded-2xl p-5">
          <h2 className="font-bold">Alert sensitivity</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Alert only when |new travel - baseline| is at least <b className="text-slate-900 dark:text-white">{threshold} min</b>.</p>
          <input aria-label="Threshold in minutes" type="range" min={5} max={20} step={1} value={threshold} onChange={(e) => setThreshold(+e.target.value)} className="w-full mt-4 accent-teal-400" />
          <div className="flex justify-between text-xs text-slate-500"><span>5 min (sensitive)</span><span>20 min (calm)</span></div>
          <p className="text-xs mt-3 text-slate-500 dark:text-slate-400">If you must leave immediately, the threshold is bypassed and an urgent banner fires.</p>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            {[['Sent', count('alert')], ['Quiet', count('suppressed')], ['Urgent', count('urgent')]].map(([l, n]) => (
              <div key={l} className="rounded-xl bg-slate-500/10 py-2"><p className="text-xl font-extrabold">{n}</p><p className="text-xs text-slate-500">{l}</p></div>
            ))}
          </div>
        </section>

        <section className="glass rounded-2xl p-5">
          <h2 className="font-bold">Satellite-verified incidents</h2>
          <ul className="mt-3 space-y-3">
            {incidents.length === 0 && <li className="text-sm text-slate-500">All clear. Use "Simulate disruption" in the sidebar to test a closure.</li>}
            {incidents.map((i) => (
              <li key={i.id} className={`text-sm ${i.active ? '' : 'opacity-50'}`}>
                <div className="flex items-center gap-2">
                  <b>{i.short}</b> <span className="text-xs text-slate-500">{i.road}, {clock(i.verifiedAt)}</span>
                  {i.active && !offline && <button onClick={() => resolveIncident(i.id)} className="ml-auto text-xs font-semibold flex items-center gap-1 text-route"><CheckCircle2 size={13} />Mark cleared</button>}
                  {!i.active && <span className="ml-auto text-xs">Cleared</span>}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{i.queueKm} km queue, +{i.delay} min. {i.why}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="glass rounded-2xl p-5 lg:col-span-2">
        <h2 className="font-bold">Explainable disruption log</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Each entry explains what changed, what it did to your departure, and why you were or weren't alerted.</p>
        <ul className="mt-4 space-y-3 max-h-[70vh] overflow-auto">
          {logs.length === 0 && <li className="text-sm text-slate-500">No events logged yet. Polling starts automatically; trigger a disruption to see the first entry.</li>}
          {logs.map((l) => {
            const k = KIND[l.kind], Icon = k.icon;
            return (
              <li key={l.id} className="flex gap-3 rounded-xl p-3 bg-slate-500/5">
                <Tip text={`${k.label}. ${l.kind === 'suppressed' ? 'The change was too small to interrupt you; it is logged for transparency.' : l.kind === 'info' ? 'System status change.' : 'Departure time was recalculated with Algorithm A.'}`}>
                  <Icon size={18} className={`${k.cls} mt-0.5`} />
                </Tip>
                <div className="text-sm">
                  <p className="font-semibold">{l.title} <span className="text-xs font-normal text-slate-500">{clock(l.ts)}</span></p>
                  <p className="text-slate-600 dark:text-slate-300">{l.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
