export default function ResultadoProducto({ resultado, cfg, fuenteTexto, urlFuente, esFavorito, onToggleFavorito, onNuevaBusqueda, resultRef }) {
  const statusBackground = cfg.label === 'APTO' ? 'bg-green-50' : cfg.label === 'NO APTO' ? 'bg-rose-50' : 'bg-amber-50';

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
          <button onClick={onToggleFavorito} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-ink/60 transition-colors hover:bg-ink/5 hover:text-accent" aria-label="Guardar en favoritos">{esFavorito ? '♥' : '♡'}</button>
        </div>
        <div className="bg-white p-5">
          <h2 className="mb-1.5 text-lg font-extrabold leading-tight text-ink">{resultado.producto?.nombre ?? 'Producto sin nombre'}</h2>
          <span className="mb-5 inline-block rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink/50">{resultado.producto?.marca ?? 'Marca desconocida'}</span>
          <div className="mb-4 rounded-lg border border-ink/5 bg-surface p-4"><p className="mb-2 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-ink/45">Ingredientes</p><p className="text-[0.8125rem] leading-relaxed text-ink/80">{resultado.producto?.ingredientes ?? 'No disponible.'}</p></div>
          <button onClick={onNuevaBusqueda} className="text-[0.8125rem] font-medium text-ink/45 transition-colors hover:text-accent">Nueva búsqueda</button>
        </div>
      </div>
    </div>
  </section>;
}
