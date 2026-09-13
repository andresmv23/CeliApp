import { Link } from 'react-router-dom';

function CheckIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
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
      <section className="overflow-hidden px-4 py-14 sm:py-16 lg:py-24">
        <div className="mx-auto max-w-[1120px]">
          <p className="mb-4 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-accent">Sobre CeliApp</p>
          <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)] lg:gap-16">
            <div>
              <h1 className="max-w-[760px] font-display text-[clamp(2.6rem,6vw,5.5rem)] font-bold leading-[1.06] tracking-[-0.03em] text-ink">
                Confianza para decidir con más <em className="italic text-accent">claridad.</em>
              </h1>
              <p className="mt-6 max-w-[610px] text-[1rem] leading-8 text-[#4B6355] sm:text-[1.125rem]">
                CeliApp es una aplicación creada para facilitar la consulta de productos a personas que conviven con la celiaquía. Porque hacer la compra debería ser más sencillo que descifrar cada etiqueta.
              </p>
            </div>
            <div className="rounded-3xl border border-accent/20 bg-accent/10 p-6 sm:p-7">
              <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
                <CheckIcon />
              </span>
              <p className="font-display text-xl font-bold leading-snug text-ink">Una ayuda para el día a día.</p>
              <p className="mt-2 text-sm leading-relaxed text-[#4B6355]">Consulta productos, entiende el resultado y decide con más información a tu alcance.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-ink/10" />

      <section className="bg-[#F0F4F1] px-4 py-14 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-[1120px] gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div>
            <p className="mb-3 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-accent">Por qué nació</p>
            <h2 className="max-w-[420px] font-display text-[clamp(2rem,4vw,3.3rem)] font-bold leading-[1.1] tracking-[-0.025em] text-ink">De una duda repetida, a una herramienta útil.</h2>
          </div>
          <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-card sm:p-8">
            <p className="text-[1rem] leading-8 text-[#4B6355]">CeliApp nació junto a mi pareja, que es celíaca. Al hacer la compra, una tarea sencilla se repetía una y otra vez: parar ante cada etiqueta, leer los ingredientes y tratar de entender si un producto podía formar parte de nuestro día a día.</p>
            <p className="mt-5 text-[1rem] leading-8 text-[#4B6355]">Con el tiempo entendí que esa duda no debería convertir algo cotidiano en una preocupación constante. Por eso quise crear una herramienta que ayudara a consultar productos de forma más rápida, clara y responsable.</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-[1120px]">
          <div className="mb-10 max-w-[610px]">
            <p className="mb-3 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-accent">Cómo entendemos la confianza</p>
            <h2 className="font-display text-[clamp(2rem,4vw,3.3rem)] font-bold leading-[1.1] tracking-[-0.025em] text-ink">Ser claros también significa reconocer los límites.</h2>
          </div>
          <div className="grid overflow-hidden rounded-3xl bg-ink/10 md:grid-cols-3 md:gap-px">
            {commitments.map(({ title, description }) => (
              <article key={title} className="bg-white p-6 sm:p-7">
                <span className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <CheckIcon />
                </span>
                <h3 className="mb-2 text-base font-bold text-ink">{title}</h3>
                <p className="text-sm leading-relaxed text-[#4B6355]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-ink/10" />

      <section className="bg-[#F0F4F1] px-4 py-14 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-[1120px] items-start gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-16">
          <div>
            <p className="mb-3 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-accent">Quién está detrás</p>
            <h2 className="max-w-[620px] font-display text-[clamp(2rem,4vw,3.3rem)] font-bold leading-[1.1] tracking-[-0.025em] text-ink">Un proyecto personal construido para seguir creciendo.</h2>
          </div>
          <div className="rounded-3xl border border-ink/10 bg-white p-6 shadow-card sm:p-8">
            <p className="text-[1rem] leading-8 text-[#4B6355]">Soy Andrés Mejía Valdez, desarrollador full-stack y creador de CeliApp. Es un proyecto personal e independiente que me ha permitido convertir una necesidad cercana en un producto real.</p>
            <p className="mt-5 text-[1rem] leading-8 text-[#4B6355]">He desarrollado CeliApp de principio a fin, trabajando la experiencia de usuario, el frontend, la API, la base de datos y el despliegue. Es mi forma de seguir aprendiendo, asumir retos técnicos y construir tecnología útil que pueda aportar valor en la vida cotidiana.</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-[1120px] rounded-3xl bg-ink px-6 py-10 text-center sm:px-10 sm:py-14">
          <p className="mx-auto max-w-[640px] font-display text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.1] tracking-[-0.025em] text-surface">Consulta un producto con más información y menos incertidumbre.</p>
          <p className="mx-auto mt-4 max-w-[550px] text-sm leading-relaxed text-surface/65 sm:text-base">CeliApp no sustituye el etiquetado del fabricante. Ante cualquier duda, revisa siempre el envase.</p>
          <Link to="/" className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-bold text-white shadow-[0_4px_16px_rgba(22,163,74,0.25)] transition hover:-translate-y-px hover:bg-green-700">
            Verificar un producto
            <ArrowIcon />
          </Link>
        </div>
      </section>
    </div>
  );
}
