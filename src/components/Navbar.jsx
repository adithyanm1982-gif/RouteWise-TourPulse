import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Satellite, Wifi, WifiOff, Moon, Sun, Map, CalendarClock, Radar, Settings, Route } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { clock } from '../utils/time';

const TABS = [
  { to: '/', label: 'Dashboard Map', icon: Map },
  { to: '/itinerary', label: 'Itinerary Planner', icon: CalendarClock },
  { to: '/radar', label: 'Disruption Radar', icon: Radar },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { offline, setOffline, theme, setTheme, notifications, markAllRead } = useAppStore();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-[1000] glass border-x-0 border-t-0">
      <div className="mx-auto max-w-[1600px] px-4 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-2 font-extrabold tracking-tight">
          <span className="grid place-items-center size-8 rounded-lg bg-route text-ink"><Route size={18} /></span>
          RouteWise &amp; TourPulse
        </div>

        <span className={`hidden md:flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1 ${offline ? 'bg-slate-500/20 text-slate-500' : 'bg-route/15 text-teal-600 dark:text-route'}`}>
          <Satellite size={13} /> Satellite Traffic Feed: {offline ? 'Paused (offline)' : 'Active'}
          {!offline && <span className="size-1.5 rounded-full bg-route animate-pulse" />}
        </span>

        <nav className="order-last w-full lg:order-none lg:w-auto flex gap-1 overflow-x-auto lg:ml-2">
          {TABS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) => `flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-lg text-sm font-semibold transition ${isActive ? 'bg-slate-900 text-white dark:bg-white dark:text-ink' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-500/10'}`}>
              <Icon size={15} />{label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setOffline(!offline)} role="switch" aria-checked={offline}
            className={`flex items-center gap-2 text-xs font-semibold rounded-full pl-2.5 pr-1.5 py-1 border ${offline ? 'border-signal text-signal' : 'border-slate-300 dark:border-white/15'}`}>
            {offline ? <WifiOff size={14} /> : <Wifi size={14} />} Offline mode
            <span className={`w-8 h-4 rounded-full p-0.5 transition ${offline ? 'bg-signal' : 'bg-slate-400/50'}`}>
              <span className={`block size-3 rounded-full bg-white transition ${offline ? 'translate-x-4' : ''}`} />
            </span>
          </button>
          <button aria-label="Toggle theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-lg hover:bg-slate-500/10">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <div className="relative">
            <button aria-label="Notifications" onClick={() => { setOpen(!open); if (!open) markAllRead(); }} className="relative p-2 rounded-lg hover:bg-slate-500/10">
              <Bell size={17} />
              {unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-alarm text-white text-[10px] font-bold grid place-items-center">{unread}</span>}
            </button>
            <AnimatePresence>
              {open && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto rounded-2xl bg-white dark:bg-panel border border-slate-200 dark:border-white/10 shadow-2xl p-2">
                  {notifications.length === 0 && <p className="p-4 text-sm text-slate-500">No alerts yet. Simulate a disruption from the sidebar to see one.</p>}
                  {notifications.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-xl hover:bg-slate-500/10 text-xs">
                      <p className={`font-bold ${n.severity === 'urgent' ? 'text-alarm' : 'text-signal'}`}>{n.title} <span className="font-normal text-slate-500">{clock(n.ts)}</span></p>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5">{n.text}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
