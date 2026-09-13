import { Link } from 'react-router-dom';

function CheckIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12.75l4.5 4.5L19 7.75" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function StatusPreview() {
  return (
    <div className="w-full max-w-[460px] overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-[0_8px_32px_rgba(13,31,20,0.08)]">
      <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white">
            <CheckIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-green-950">APTO</p>
            <p className="mt-0.5 text-xs text-green-950/65">Resultado del análisis</p>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-green-950/85">No se han identificado ingredientes con gluten en la información disponible del producto.</p>
        <p className="mt-3 text-xs text-green-950/60">Fuente: Base de datos del producto</p>
      </div>
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.09em] text-ink/40">Ejemplo de resultado</p>
            <h2 className="mt-1 text-base font-bold text-ink">Producto sin gluten</h2>
            <span className="mt-2 inline-block rounded-full bg-ink/5 px-2.5 py-1 text-xs font-semibold text-ink/50">Información de ejemplo</span>
          </div>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/10 text-ink/35">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09A6.01 6.01 0 0116.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
          </span>
        </div>
        <div className="rounded-2xl bg-surface p-4">
          <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-ink/45">Ingredientes</p>
          <p className="text-[0.8125rem] leading-relaxed text-ink/75">Lista de ingredientes consultada para realizar el análisis.</p>
        </div>
      </div>
    </div>
  );
}

const commitments = [
  {
    title: 'Información clara',
    description: 'Traducimos la información disponible sobre ingredientes en una respuesta sencilla de entender, para que consultar un producto no sea una tarea interminable.',
  },
  {
    title: 'Incertidumbre visible',
    description: 'Cuando no hay información suficiente para dar una respuesta fiable, CeliApp muestra DUDOSO. Reconocer los límites también es una forma de cuidar.',
  },
  {
    title: 'Decisiones responsables',
    description: 'CeliApp acompaña la consulta, pero no sustituye el etiquetado del fabricante ni el criterio personal de cada usuario.',
  },
];

export default function SobreCeliApp() {
  return (
    <div className="bg-surface font-sans text-ink">
      <section className="border-b border-ink/10 px-4 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-[1040px] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
          <div>
            <p className="mb-4 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-accent">Sobre CeliApp</p>
            <h1 className="max-w-[600px] text-[clamp(2.15rem,4.2vw,3.45rem)] font-bold leading-[1.12] tracking-[-0.035em] text-ink">Confianza para decidir con más claridad.</h1>
            <p className="mt-5 max-w-[575px] text-[1rem] leading-7 text-[#4B6355] sm:text-[1.0625rem]">CeliApp es una aplicación creada para facilitar la consulta de productos a personas que conviven con la celiaquía. Porque hacer la compra debería ser más sencillo que descifrar cada etiqueta.</p>
            <Link to="/" className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-white shadow-[0_2px_8px_rgba(22,163,74,0.18)] transition hover:bg-green-700 hover:shadow-[0_4px_14px_rgba(22,163,74,0.25)]">
              Verificar un producto
              <ArrowIcon />
            </Link>
          </div>
          <div className="justify-self-center lg:justify-self-end">
            <StatusPreview />
          </div>
        </div>
      </section>

      <section className="bg-[#F0F4F1] px-4 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-[1040px] gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-16">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-accent">Por qué nació</p>
            <h2 className="mt-3 text-[clamp(1.65rem,3vw,2.35rem)] font-bold leading-[1.18] tracking-[-0.025em] text-ink">De una duda repetida, a una herramienta útil.</h2>
          </div>
          <div className="max-w-[660px] border-l-2 border-accent pl-5 sm:pl-7">
            <p className="text-[1rem] leading-8 text-[#4B6355]">CeliApp nació junto a mi pareja, que es celíaca. Al hacer la compra, una tarea sencilla se repetía una y otra vez: parar ante cada etiqueta, leer los ingredientes y tratar de entender si un producto podía formar parte de nuestro día a día.</p>
            <p className="mt-5 text-[1rem] leading-8 text-[#4B6355]">Con el tiempo entendí que esa duda no debería convertir algo cotidiano en una preocupación constante. Por eso quise crear una herramienta que ayudara a consultar productos de forma más rápida, clara y responsable.</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-[1040px]">
          <div className="max-w-[650px]">
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-accent">Cómo entendemos la confianza</p>
            <h2 className="mt-3 text-[clamp(1.65rem,3vw,2.35rem)] font-bold leading-[1.18] tracking-[-0.025em] text-ink">Ser claros también significa reconocer los límites.</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3 md:gap-5">
            {commitments.map(({ title, description }) => (
              <article key={title} className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6">
                <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <CheckIcon className="h-[18px] w-[18px]" />
                </span>
                <h3 className="text-[0.9375rem] font-bold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#4B6355]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-[#F7FAF8] px-4 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-[1040px] gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-16">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-accent">Quién está detrás</p>
            <h2 className="mt-3 text-[clamp(1.65rem,3vw,2.35rem)] font-bold leading-[1.18] tracking-[-0.025em] text-ink">Andrés Mejía Valdez</h2>
            <p className="mt-2 text-sm text-[#4B6355]">Desarrollador full-stack y creador de CeliApp</p>
          </div>
          <div className="max-w-[660px]">
            <p className="text-[1rem] leading-8 text-[#4B6355]">Soy Andrés Mejía Valdez, desarrollador full-stack y creador de CeliApp. Es un proyecto personal e independiente que me ha permitido convertir una necesidad cercana en un producto real.</p>
            <p className="mt-5 text-[1rem] leading-8 text-[#4B6355]">He desarrollado CeliApp de principio a fin, trabajando la experiencia de usuario, el frontend, la API, la base de datos y el despliegue. Es mi forma de seguir aprendiendo, asumir retos técnicos y construir tecnología útil que pueda aportar valor en la vida cotidiana.</p>
            <Link to="/" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-accent transition hover:text-green-700">
              Probar CeliApp
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:py-14 lg:py-16">
        <div className="mx-auto flex max-w-[1040px] flex-col gap-4 rounded-2xl border border-amber-500/20 bg-amber-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-sm font-bold text-amber-800">!</span>
            <p className="max-w-[700px] text-sm leading-6 text-amber-950/80"><span className="font-bold text-amber-950">Consulta responsable.</span> CeliApp no sustituye el etiquetado del fabricante. Ante cualquier duda, revisa siempre el envase.</p>
          </div>
          <Link to="/" className="shrink-0 text-sm font-bold text-amber-900 underline decoration-amber-900/35 underline-offset-4 transition hover:text-amber-700">Volver al buscador</Link>
        </div>
      </section>
    </div>
  );
}
