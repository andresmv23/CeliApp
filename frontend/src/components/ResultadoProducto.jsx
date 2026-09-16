function HeartIcon({ filled = false }) {
  return <svg className="h-5 w-5" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>;
}

export default function ResultadoProducto({ resultado, cfg, fuenteTexto, urlFuente, esFavorito, onToggleFavorito, onNuevaBusqueda, resultRef }) {
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
          <div className="mb-5 flex flex-col gap-5 sm:flex-row">
            {producto?.imagen_url && <div className="flex h-44 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink/10 bg-surface p-4 sm:w-44"><img src={producto.imagen_url} alt={producto.nombre ?? 'Producto'} className="h-full w-full object-contain" onError={(event) => { event.currentTarget.parentElement.style.display = 'none'; }} /></div>}
            <div className="min-w-0 flex-1">
              <h2 className="mb-1.5 text-lg font-extrabold leading-tight text-ink">{producto?.nombre ?? 'Producto sin nombre'}</h2>
              <span className="inline-block rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink/50">{producto?.marca ?? 'Marca desconocida'}</span>
            </div>
          </div>
          <div className="mb-4 rounded-lg border border-ink/5 bg-surface p-4"><p className="mb-2 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink/45">Ingredientes</p><p className="text-[0.8125rem] leading-relaxed text-ink/80">{producto?.ingredientes ?? 'No disponible.'}</p></div>
          <button onClick={onNuevaBusqueda} className="text-[0.8125rem] font-medium text-ink/45 transition-colors hover:text-accent">Nueva búsqueda</button>
        </div>
      </div>
    </div>
  </section>;
}
