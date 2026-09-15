function CameraIcon({ className = '', strokeWidth = 2 }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>;
}

function SearchIcon() {
  return <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 0 14 0z" /></svg>;
}

export default function HeroBuscador({ ean, setEan, loading, error, onBuscar, onAbrirScanner }) {
  return <section id="inicio" className="overflow-hidden bg-surface px-4 py-10 sm:py-12 md:py-14 lg:py-20">
    <div className="mx-auto max-w-[1120px]">
      <div className="reveal mb-6"><span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.09em] text-accent">Beta 1.0 — Gratis</span></div>
      <h1 className="reveal mb-4 max-w-[820px] font-display text-[clamp(2.2rem,6vw,5.5rem)] font-bold leading-[1.08] tracking-[-0.02em] text-ink [transition-delay:80ms]">¿Es este producto<br /><em className="italic text-accent">seguro</em>{' '}<span className="text-ink/40">para ti?</span></h1>
      <p className="reveal mb-7 max-w-[460px] text-[clamp(0.95rem,1.5vw,1.1rem)] leading-7 text-[#4B6355] [transition-delay:140ms]">Introduce el código de barras y nuestra IA analiza cada ingrediente al instante. Sin dudas, sin riesgos.</p>
      <form className="reveal mb-4 max-w-[680px] [transition-delay:200ms]" onSubmit={onBuscar}>
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-ink/15 bg-white p-1.5">
          <label className="flex min-w-0 flex-1 items-center gap-3 px-3 py-1.5 text-ink/35">
            <SearchIcon />
            <input type="text" inputMode="numeric" autoComplete="off" placeholder="Introduce el código EAN" value={ean} onChange={(event) => setEan(event.target.value)} className="min-w-0 flex-1 bg-transparent py-2 text-[0.9375rem] text-ink outline-none placeholder:text-ink/40" />
          </label>
          <button type="button" onClick={onAbrirScanner} title="Escanear código de barras" aria-label="Escanear código de barras" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink/40 transition-colors hover:bg-accent/10 hover:text-accent"><CameraIcon className="h-5 w-5" strokeWidth={1.75} /></button>
          <button type="submit" disabled={loading || !ean.trim()} className="flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-accent px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-accent/30 sm:min-w-[126px]">{loading ? 'Analizando…' : 'Verificar'}</button>
        </div>
      </form>
      {error && <div className="mb-4 flex max-w-[680px] items-start gap-2.5 rounded-lg border border-red-600/15 bg-red-600/5 px-4 py-3.5 text-sm text-red-600">{error}</div>}
      <div className="reveal [transition-delay:320ms]"><p className="flex flex-wrap gap-x-6 gap-y-1 text-[0.8125rem] font-medium tracking-[0.01em] text-ink/45"><span>+50.000 productos analizados</span><span className="hidden text-ink/10 sm:inline">·</span><span>99% de precisión</span><span className="hidden text-ink/10 sm:inline">·</span><span>Gratis, sin suscripción</span></p></div>
    </div>
  </section>;
}
