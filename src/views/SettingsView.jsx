import { useAppStore } from '../store/useAppStore';

export default function SettingsView() {
  const { theme, setTheme, threshold, setThreshold, resetDemo } = useAppStore();
  const row = 'flex items-center justify-between gap-4 py-3 border-b border-slate-200 dark:border-white/10 last:border-0';
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-extrabold">Settings</h1>
      <section className="glass rounded-2xl px-5">
        <div className={row}><span className="text-sm font-semibold">Theme</span>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} className="rounded-lg border border-slate-300 dark:border-white/15 bg-transparent px-3 py-1.5 text-sm"><option value="dark">Dark</option><option value="light">Light</option></select></div>
        <div className={row}><span className="text-sm font-semibold">Alert threshold: {threshold} min</span>
          <input type="range" min={5} max={20} value={threshold} onChange={(e) => setThreshold(+e.target.value)} className="accent-teal-400" /></div>
        <div className={row}><div><p className="text-sm font-semibold">Reset demo data</p><p className="text-xs text-slate-500">Restores the hill-station circuit and clears logs and incidents.</p></div>
          <button onClick={resetDemo} className="rounded-lg bg-alarm text-white text-sm font-semibold px-3 py-1.5">Reset</button></div>
      </section>
    </div>
  );
}
