import { Link } from 'react-router-dom';

function CheckIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
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
    <aside aria-label="Ejemplo de resultado apto" className="overflow-hidden rounded-2xl border border-line bg-paper shadow-card">
      <div className="border-b border-brand-100 bg-brand-50 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-apto text-paper">
            <CheckIcon />
          </span>
          <div>
            <p className="text-sm font-bold text-ink">APTO</p>
            <p className="text-xs text-muted">Resultado del análisis</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-ink">No se han identificado ingredientes con gluten en la información disponible del producto.</p>
        <p className="mt-3 text-xs text-muted">Fuente: Base de datos del producto</p>
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Ejemplo de resultado</p>
        <h2 className="mt-1 text-base font-bold text-ink">Producto sin gluten</h2>
        <div className="mt-4 rounded-xl bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Ingredientes</p>
          <p className="mt-2 text-sm leading-6 text-muted">Lista de ingredientes consultada para realizar el análisis.</p>
        </div>
      </div>
    </aside>
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
    <main className="bg-paper font-sans text-ink">
      <section className="border-b border-line bg-surface px-4 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Sobre CeliApp</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Confianza para decidir con más claridad.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted">CeliApp es una aplicación creada para facilitar la consulta de productos a personas que conviven con la celiaquía. Porque hacer la compra debería ser más sencillo que descifrar cada etiqueta.</p>
            <Link to="/" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-paper transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-100">
              Verificar un producto
              <ArrowIcon />
            </Link>
          </div>
          <div className="mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
            <StatusPreview />
          </div>
        </div>
      </section>

      <section className="border-b border-line px-4 py-12 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3 lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Por qué nació</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">De una duda repetida, a una herramienta útil.</h2>
          </div>
          <div className="max-w-2xl space-y-5 text-base leading-7 text-muted lg:col-span-2">
            <p>CeliApp nació junto a mi pareja, que es celíaca. Al hacer la compra, una tarea sencilla se repetía una y otra vez: parar ante cada etiqueta, leer los ingredientes y tratar de entender si un producto podía formar parte de nuestro día a día.</p>
            <p>Con el tiempo entendí que esa duda no debería convertir algo cotidiano en una preocupación constante. Por eso quise crear una herramienta que ayudara a consultar productos de forma más rápida, clara y responsable.</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Cómo entendemos la confianza</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Ser claros también significa reconocer los límites.</h2>
          </div>
          <dl className="mt-8 divide-y divide-line border-y border-line">
            {commitments.map(({ title, description }) => (
              <div key={title} className="grid gap-3 py-6 sm:grid-cols-3 sm:gap-8">
                <dt className="flex items-center gap-3 text-base font-semibold text-ink">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <CheckIcon className="h-4 w-4" />
                  </span>
                  {title}
                </dt>
                <dd className="text-sm leading-6 text-muted sm:col-span-2">{description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-y border-line bg-surface px-4 py-12 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3 lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Quién está detrás</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Andrés Mejía Valdez</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Desarrollador full-stack y creador de CeliApp</p>
          </div>
          <div className="max-w-2xl space-y-5 text-base leading-7 text-muted lg:col-span-2">
            <p>Soy Andrés Mejía Valdez, desarrollador full-stack y creador de CeliApp. Es un proyecto personal e independiente que me ha permitido convertir una necesidad cercana en un producto real.</p>
            <p>He desarrollado CeliApp de principio a fin, trabajando la experiencia de usuario, el frontend, la API, la base de datos y el despliegue. Es mi forma de seguir aprendiendo, asumir retos técnicos y construir tecnología útil que pueda aportar valor en la vida cotidiana.</p>
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition hover:text-brand-700 focus:outline-none focus:underline">
              Probar CeliApp
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:py-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 rounded-xl border border-cream-300 bg-cream-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="max-w-3xl text-sm leading-6 text-ink"><span className="font-semibold">Consulta responsable.</span> CeliApp no sustituye el etiquetado del fabricante. Ante cualquier duda, revisa siempre el envase.</p>
          <Link to="/" className="shrink-0 text-sm font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 transition hover:text-brand-800">Volver al buscador</Link>
        </div>
      </section>
    </main>
  );
}
