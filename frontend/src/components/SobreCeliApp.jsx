import { Link } from 'react-router-dom';

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

const commitments = [
  {
    number: '01',
    title: 'Información clara',
    description: 'Traducimos la información disponible sobre ingredientes en una respuesta sencilla de entender, para que consultar un producto no sea una tarea interminable.',
  },
  {
    number: '02',
    title: 'Incertidumbre visible',
    description: 'Cuando no hay información suficiente para dar una respuesta fiable, CeliApp muestra DUDOSO. Reconocer los límites también es una forma de cuidar.',
  },
  {
    number: '03',
    title: 'Decisiones responsables',
    description: 'CeliApp acompaña la consulta, pero no sustituye el etiquetado del fabricante ni el criterio personal de cada usuario.',
  },
];

export default function SobreCeliApp() {
  return (
    <div className="overflow-hidden bg-surface font-sans text-ink">
      <section className="relative px-4 pb-20 pt-16 sm:pb-28 sm:pt-20 lg:pb-32 lg:pt-28">
        <div className="pointer-events-none absolute left-[7%] top-12 h-44 w-44 rounded-full border border-accent/15 sm:h-64 sm:w-64" />
        <div className="pointer-events-none absolute right-[-4rem] top-16 h-56 w-56 rounded-full border border-ink/[0.07] sm:right-[8%] sm:h-80 sm:w-80" />
        <div className="relative mx-auto max-w-[1120px]">
          <p className="mb-8 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-accent">Sobre CeliApp</p>
          <h1 className="max-w-[900px] font-display text-[clamp(3rem,7vw,6.6rem)] font-bold leading-[0.98] tracking-[-0.045em] text-ink">
            Confianza para decidir<br className="hidden sm:block" /> con más <span className="relative whitespace-nowrap italic text-accent">claridad<span className="absolute -bottom-1 left-0 h-1.5 w-full rounded-full bg-accent/20" /></span>.
          </h1>
          <div className="mt-11 grid max-w-[850px] gap-5 border-t border-ink/15 pt-5 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-8">
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#4B6355]">CeliApp</span>
            <p className="max-w-[620px] text-[1rem] leading-8 text-[#4B6355] sm:text-[1.125rem]">
              CeliApp es una aplicación creada para facilitar la consulta de productos a personas que conviven con la celiaquía. Porque hacer la compra debería ser más sencillo que descifrar cada etiqueta.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-ink/10 bg-[#EEF3EF] px-4 py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-[1120px]">
          <div className="mb-10 flex items-baseline justify-between border-b border-ink/15 pb-4 sm:mb-14">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-accent">Por qué nació</p>
            <span className="font-display text-2xl italic text-accent/55 sm:text-3xl">01</span>
          </div>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <h2 className="font-display text-[clamp(2.2rem,4.4vw,4.2rem)] font-bold leading-[1.04] tracking-[-0.035em] text-ink lg:col-span-5">
              De una duda repetida, a una herramienta útil.
            </h2>
            <div className="border-l-2 border-accent pl-6 sm:pl-8 lg:col-span-6 lg:col-start-7">
              <p className="text-[1rem] leading-8 text-[#4B6355]">CeliApp nació junto a mi pareja, que es celíaca. Al hacer la compra, una tarea sencilla se repetía una y otra vez: parar ante cada etiqueta, leer los ingredientes y tratar de entender si un producto podía formar parte de nuestro día a día.</p>
              <p className="mt-6 text-[1rem] leading-8 text-[#4B6355]">Con el tiempo entendí que esa duda no debería convertir algo cotidiano en una preocupación constante. Por eso quise crear una herramienta que ayudara a consultar productos de forma más rápida, clara y responsable.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-[1120px]">
          <div className="grid gap-8 border-b border-ink/15 pb-10 sm:pb-12 lg:grid-cols-12 lg:gap-16">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-accent lg:col-span-3">Cómo entendemos la confianza</p>
            <h2 className="max-w-[720px] font-display text-[clamp(2.2rem,4.4vw,4.2rem)] font-bold leading-[1.04] tracking-[-0.035em] text-ink lg:col-span-8 lg:col-start-5">Ser claros también significa reconocer los límites.</h2>
          </div>
          <div>
            {commitments.map(({ number, title, description }) => (
              <article key={number} className="grid gap-4 border-b border-ink/15 py-7 transition-colors hover:bg-accent/[0.035] sm:grid-cols-[5rem_minmax(10rem,0.7fr)_minmax(0,1.3fr)] sm:gap-6 sm:py-9">
                <span className="font-display text-2xl italic text-accent/65">{number}</span>
                <h3 className="text-[1.05rem] font-bold text-ink sm:pt-1">{title}</h3>
                <p className="max-w-[510px] text-sm leading-7 text-[#4B6355] sm:text-[0.9375rem]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative bg-ink px-4 py-16 text-surface sm:py-20 lg:py-28">
        <div className="pointer-events-none absolute bottom-0 right-[7%] h-52 w-52 translate-y-1/2 rounded-full border border-white/10 sm:h-80 sm:w-80" />
        <div className="relative mx-auto max-w-[1120px]">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-accent">Quién está detrás</p>
              <p className="mt-5 font-display text-2xl font-bold leading-tight text-surface sm:text-3xl">Andrés Mejía Valdez</p>
              <p className="mt-1 text-sm text-surface/55">Desarrollador full-stack<br />Creador de CeliApp</p>
            </div>
            <div className="max-w-[670px] border-t border-white/20 pt-6 lg:col-span-7 lg:col-start-6">
              <p className="text-[1rem] leading-8 text-surface/75">Soy Andrés Mejía Valdez, desarrollador full-stack y creador de CeliApp. Es un proyecto personal e independiente que me ha permitido convertir una necesidad cercana en un producto real.</p>
              <p className="mt-6 text-[1rem] leading-8 text-surface/75">He desarrollado CeliApp de principio a fin, trabajando la experiencia de usuario, el frontend, la API, la base de datos y el despliegue. Es mi forma de seguir aprendiendo, asumir retos técnicos y construir tecnología útil que pueda aportar valor en la vida cotidiana.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:py-16 lg:py-20">
        <div className="mx-auto flex max-w-[1120px] flex-col justify-between gap-8 border-t border-ink/15 pt-8 sm:flex-row sm:items-end sm:pt-10">
          <div>
            <p className="font-display text-[clamp(1.8rem,3.5vw,3rem)] font-bold leading-[1.08] tracking-[-0.025em] text-ink">Consulta un producto con más<br className="hidden sm:block" /> información y menos incertidumbre.</p>
            <p className="mt-4 max-w-[560px] text-sm leading-6 text-[#4B6355]">CeliApp no sustituye el etiquetado del fabricante. Ante cualquier duda, revisa siempre el envase.</p>
          </div>
          <Link to="/" className="group inline-flex shrink-0 items-center gap-3 self-start border-b-2 border-accent pb-2 text-sm font-bold text-ink transition hover:border-ink sm:self-auto">
            Verificar un producto
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-white transition-transform group-hover:translate-x-1">
              <ArrowIcon />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
