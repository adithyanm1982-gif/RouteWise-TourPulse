import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AlertOctagon } from 'lucide-react';
import { useAppStore, useVisible } from './store/useAppStore';
import { isUrgent } from './utils/algorithms';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardView from './views/DashboardView';
import ItineraryView from './views/ItineraryView';
import DisruptionRadarView from './views/DisruptionRadarView';
import SettingsView from './views/SettingsView';

function UrgentBanner() {
  const { events } = useVisible();
  const now = useAppStore((s) => s.now);
  const urgent = events.filter((e) => isUrgent(e.arriveBy, e.liveTravel, now));
  if (!urgent.length) return null;
  return (
    <div role="alert" className="bg-alarm text-white text-sm font-bold px-4 py-2.5 flex items-center justify-center gap-2">
      <AlertOctagon size={16} /> Leave now for {urgent.map((e) => e.title).join(', ')}. Live travel time leaves no room to wait.
    </div>
  );
}

export default function App() {
  const theme = useAppStore((s) => s.theme);
  const tick = useAppStore((s) => s.tick);
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);
  useEffect(() => { tick(); const id = setInterval(tick, 1000); return () => clearInterval(id); }, [tick]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-ink dark:text-slate-100">
      <Navbar />
      <UrgentBanner />
      <div className="mx-auto max-w-[1600px] flex gap-4 p-4">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/itinerary" element={<ItineraryView />} />
            <Route path="/radar" element={<DisruptionRadarView />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
