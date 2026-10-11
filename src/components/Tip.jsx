export default function Tip({ text, children }) {
  return (
    <span className="relative group inline-flex" tabIndex={0}>
      {children}
      <span role="tooltip" className="pointer-events-none absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg bg-slate-900 text-slate-100 text-xs leading-relaxed p-2.5 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity shadow-xl">
        {text}
      </span>
    </span>
  );
}
