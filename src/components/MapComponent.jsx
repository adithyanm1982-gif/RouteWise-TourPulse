import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Layers, LocateFixed, Satellite, CloudFog, Mountain, WifiOff } from 'lucide-react';
import { clock } from '../utils/time';

const pin = (c) => L.divIcon({ className: '', html: `<div class="rw-pin" style="--c:${c}"><b></b><i></i></div>`, iconSize: [18, 18], iconAnchor: [9, 9] });
const warn = L.divIcon({ className: '', html: '<div class="rw-warn">!</div>', iconSize: [30, 30], iconAnchor: [15, 15] });
const TILES = {
  map: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  sat: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
};

function Fit({ points, tick }) {
  const map = useMap();
  useEffect(() => { if (points.length) map.fitBounds(points, { padding: [40, 40] }); }, [tick]); // eslint-disable-line
  return null;
}

export default function MapComponent({ events, incidents, selectedId, onSelect, offline, className = '' }) {
  const [sat, setSat] = useState(false);
  const [traffic, setTraffic] = useState(true);
  const [fit, setFit] = useState(0);
  const [ready, setReady] = useState(false);
  const pts = events.flatMap((e) => [[e.from.lat, e.from.lng], [e.to.lat, e.to.lng]]);
  const active = incidents.filter((i) => i.active);
  const delayed = new Set(active.map((i) => i.eventId));
  const itinerary = events.filter((e) => e.category !== 'Commute').sort((a, b) => a.arriveBy - b.arriveBy);
  const finalId = itinerary[itinerary.length - 1]?.id;

  const btn = (on) => `p-2 rounded-lg glass text-xs font-semibold flex items-center gap-1.5 ${on ? 'text-route' : ''}`;

  return (
    <div className={`relative isolate rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 ${offline ? 'offline-tiles' : ''} ${className}`}>
      {!ready && <div className="absolute inset-0 z-[500] grid place-items-center bg-slate-200 dark:bg-panel animate-pulse text-sm text-slate-500">Loading satellite map...</div>}
      <MapContainer center={[11.38, 76.8]} zoom={11} className="h-full w-full" whenReady={() => setReady(true)}>
        <TileLayer key={sat ? 's' : 'm'} url={sat ? TILES.sat : TILES.map} attribution="&copy; OpenStreetMap / Esri" />
        <Fit points={pts} tick={fit} />

        {events.map((e) => {
          const hit = delayed.has(e.id);
          const color = hit && traffic ? '#f43f5e' : selectedId === e.id ? '#2dd4bf' : '#38bdf8';
          return <Polyline key={e.id} positions={e.route} eventHandlers={{ click: () => onSelect?.(e.id) }}
            pathOptions={{ color, weight: selectedId === e.id ? 7 : 4, opacity: 0.85, dashArray: hit && traffic ? '8 8' : undefined }} />;
        })}

        {events.map((e) => (
          <Marker key={e.id + 'to'} position={[e.to.lat, e.to.lng]} icon={pin(e.id === finalId ? '#a78bfa' : '#38bdf8')} eventHandlers={{ click: () => onSelect?.(e.id) }}>
            <Popup><b>{e.to.name}</b><br />{e.title}<br />Arrive by {clock(e.arriveBy)}</Popup>
          </Marker>
        ))}
        {events[0] && <Marker position={[events.find((e) => e.category !== 'Commute')?.from.lat ?? events[0].from.lat, events.find((e) => e.category !== 'Commute')?.from.lng ?? events[0].from.lng]} icon={pin('#2dd4bf')}><Popup>Trip start</Popup></Marker>}

        {active.map((i) => (
          <Marker key={i.id} position={[i.lat, i.lng]} icon={warn}>
            <Popup>
              <b>{i.short} (satellite verified)</b><br />{i.road}, {i.queueKm} km queue<br />+{i.delay} min on the affected route<br />{i.why}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2 items-end">
        <button className={btn(sat)} onClick={() => setSat(!sat)}><Satellite size={14} />{sat ? 'Satellite' : 'Default map'}</button>
        <button className={btn(traffic)} onClick={() => setTraffic(!traffic)}><Layers size={14} />Traffic {traffic ? 'on' : 'off'}</button>
        <button className={btn(false)} onClick={() => setFit(fit + 1)} aria-label="Recenter"><LocateFixed size={14} />Recenter</button>
      </div>

      <div className="absolute bottom-3 left-3 z-[400] glass rounded-xl p-3 text-xs space-y-1">
        <p className="flex items-center gap-1.5 font-bold"><CloudFog size={14} />Nilgiris: 13&deg;C, mist</p>
        <p className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><Mountain size={14} />Ghat roads, 2,240 m peak</p>
        <p className="text-slate-500 dark:text-slate-400">{active.length} active incident{active.length === 1 ? '' : 's'}</p>
      </div>

      {offline && (
        <div className="absolute top-3 left-3 z-[400] rounded-xl bg-slate-900/90 text-slate-100 text-xs p-2.5 flex gap-2 items-center max-w-[230px]">
          <WifiOff size={14} /> Offline vault: cached map area and itinerary.
        </div>
      )}
    </div>
  );
}
