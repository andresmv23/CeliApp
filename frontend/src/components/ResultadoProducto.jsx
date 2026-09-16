function HeartIcon({ filled = false }) {
  return <svg className="h-5 w-5" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>;
}

function CameraIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 01-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0z" /></svg>;
}

export default function ResultadoProducto({ resultado, cfg, fuenteTexto, urlFuente, esFavorito, onToggleFavorito, onNuevaBusqueda, onAnalizarFoto, resultRef }) {
  const statusBackground = cfg.label === 'APTO' ? 'bg-green-50' : cfg.label === 'NO APTO' ? 'bg-rose-50' : 'bg-amber-50';
  const producto = resultado.producto;

  return <section ref={resultRef} className="bg-surface px-4 py-12">
    <div className="mx-auto max-w-[1120px]">
      <p className="mb-6 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-ink/45">Resultado del análisis</p>
      <div className="max-w-[640px] overflow-hidden rounded-xl border border-ink/15 bg-white">
        <div className={`flex items-start justify-between gap-4 border-b border-ink/10 ${statusBackground} p-5`}>
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-3"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cfg.bg} text-sm font-extrabold text-white`}>{cfg.icon}</span><span className={`text-[0.8rem] font-extrabold uppercase tracking-[0.1em] ${cfg.text}`}>{cfg.label}</span></div>
            <p className={`mb-3 text-sm leading-relaxed ${cfg.text} opacity-85`}>{resultado.analisis?.motivo ?? 'Análisis no disponible'}</p>
            <div className={`text-xs ${cfg.text} opacity-70`}><span>Fuente: {fuenteTexto}</span>{urlFuente && <> · <a href={urlFuente} target="_blank" rel="noopener noreferrer" className="underline">Ver fuente original</a></>}</div>
          </div>
          <button onClick={onToggleFavorito} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/60 transition-colors hover:text-accent focus:outline-none focus:ring-4 focus:ring-accent/10 ${esFavorito ? 'text-accent' : ''}`} aria-label={esFavorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}><HeartIcon filled={esFavorito} /></button>
        </div>
        <div className="bg-white p-5">
          <div className="mb-5 flex items-center gap-4 rounded-lg border border-ink/10 bg-white p-3 sm:gap-5">
            {producto?.imagen_url ? <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-md border border-ink/10 bg-surface p-2.5 sm:h-36 sm:w-36"><img src={producto.imagen_url} alt={producto.nombre ?? 'Producto'} className="h-full w-full object-contain" onError={(event) => { event.currentTarget.parentElement.style.display = 'none'; }} /></div> : <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-md border border-dashed border-ink/15 bg-surface text-center text-xs text-ink/40 sm:h-36 sm:w-36">Sin imagen</div>}
            <div className="min-w-0 flex-1"><p className="mb-1 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink/40">Producto</p><h2 className="mb-2 text-xl font-extrabold leading-tight text-ink">{producto?.nombre ?? 'Producto sin nombre'}</h2><span className="inline-flex max-w-full rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink/55">{producto?.marca ?? 'Marca desconocida'}</span></div>
          </div>
          <div className="mb-4 rounded-lg border border-ink/5 bg-surface p-4"><p className="mb-2 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink/45">Ingredientes</p><p className="text-[0.8125rem] leading-relaxed text-ink/80">{producto?.ingredientes ?? 'No disponible.'}</p></div>
          <div className="mb-5 rounded-lg border border-accent/20 bg-accent/[0.06] p-4 sm:flex sm:items-center sm:justify-between sm:gap-4"><div className="mb-3 sm:mb-0"><p className="text-sm font-bold text-ink">¿Necesitas una comprobación adicional?</p><p className="mt-1 text-[0.8125rem] leading-relaxed text-ink/60">Haz una foto nítida donde se vean el nombre y la marca. La IA buscará información actualizada del producto para revisarlo.</p></div><button type="button" onClick={onAnalizarFoto} className="flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-700 sm:w-auto"><CameraIcon />Analizar con foto</button></div>
          <button onClick={onNuevaBusqueda} className="group inline-flex items-center gap-1 text-[0.8125rem] font-bold text-accent transition-colors hover:text-green-700"><span className="border-b-2 border-accent/35 pb-0.5 transition-colors group-hover:border-green-700">Nueva búsqueda</span><svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5l6 7.5-6 7.5M19.5 12h-15" /></svg></button>
        </div>
      </div>
    </div>
  </section>;
}
