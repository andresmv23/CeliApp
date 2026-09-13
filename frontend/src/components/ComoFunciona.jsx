import { Link } from 'react-router-dom';

function SearchIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m2.1-5.4a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" /></svg>;
}

function CheckIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12.75l4.5 4.5L19 7.75" /></svg>;
}

function AlertIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3h.008M10.29 3.86L2.82 16.33A2.25 2.25 0 004.75 19.7h14.5a2.25 2.25 0 001.93-3.37L13.71 3.86a2 2 0 00-3.42 0z" /></svg>;
}

function CameraIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 0 1 9 0z" /></svg>;
}

const steps = [
  { number: '1', title: 'Busca el producto', description: 'Escribe el código EAN que aparece bajo el código de barras o utiliza la cámara de tu móvil para escanearlo.' },
  { number: '2', title: 'Consulta la información disponible', description: 'CeliApp reúne los datos disponibles del producto y revisa los ingredientes para ayudarte a interpretarlos.' },
  { number: '3', title: 'Revisa el resultado', description: 'Recibes un estado claro con una explicación. Si faltan datos para una respuesta fiable, el resultado será DUDOSO.' },
];

const results = [
  { label: 'APTO', icon: <CheckIcon />, className: 'border-brand-200 bg-brand-50 text-brand-800', description: 'No se han identificado ingredientes con gluten en la información disponible del producto.' },
  { label: 'NO APTO', icon: <AlertIcon />, className: 'border-red-200 bg-red-50 text-red-900', description: 'La información disponible indica la presencia de gluten o de un ingrediente que requiere evitarse.' },
  { label: 'DUDOSO', icon: <AlertIcon />, className: 'border-amber-200 bg-amber-50 text-amber-900', description: 'No hay información suficiente para dar una respuesta fiable. Revisa el envase antes de decidir.' },
];

const faqs = [
  { question: '¿Qué significa que un producto sea DUDOSO?', answer: 'Significa que la información disponible no permite dar una respuesta fiable. En ese caso, revisa el etiquetado del envase o consulta al fabricante.' },
  { question: '¿CeliApp sustituye la lectura de la etiqueta?', answer: 'No. CeliApp sirve como ayuda para consultar productos, pero la información del fabricante y el envase son siempre la referencia final.' },
  { question: '¿Qué hago si no encuentro un producto?', answer: 'Prueba a introducir de nuevo el código EAN. Si el producto no está disponible, revisa directamente los ingredientes y la información de alérgenos del envase.' },
];

export default function ComoFunciona() {
  return (
    <main className="bg-paper font-sans text-ink">
      <section className="border-b border-line bg-surface px-4 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Cómo funciona CeliApp</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Cómo comprobar si un producto contiene gluten</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted">Consulta un código de barras, entiende la información disponible y revisa el resultado antes de elegir un producto.</p>
          <Link to="/" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-paper transition hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card focus:outline-none focus:ring-4 focus:ring-brand-100">
            <SearchIcon />
            Verificar un producto
          </Link>
        </div>
      </section>

      <section className="px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">El proceso</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Tres pasos para consultar un producto</h2>
          </div>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map(({ number, title, description }, index) => (
              <li key={number} className="rounded-2xl border border-line bg-paper p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-card-hover">
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-700">{number}</span>
                  {index === 0 ? <CameraIcon /> : index === 1 ? <SearchIcon /> : <CheckIcon />}
                </div>
                <h3 className="mt-5 text-base font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-line bg-surface px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">El resultado</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Qué significa cada respuesta</h2>
              <p className="mt-3 text-sm leading-6 text-muted">El resultado muestra lo que se ha podido comprobar con la información disponible del producto.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-1">
              {results.map(({ label, icon, className, description }) => (
                <article key={label} className={`flex gap-4 rounded-xl border p-4 ${className}`}>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper/75">{icon}</span>
                  <div>
                    <h3 className="text-sm font-bold">{label}</h3>
                    <p className="mt-1 text-sm leading-6 opacity-80">{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3 lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Uso responsable</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Revisa siempre el envase</h2>
          </div>
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-cream-300 bg-cream-100 p-5">
              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper text-dudoso"><AlertIcon /></span>
                <div>
                  <p className="text-sm font-semibold text-ink">La etiqueta del fabricante es la referencia final</p>
                  <p className="mt-2 text-sm leading-6 text-muted">Las recetas y los datos de los productos pueden cambiar. Si tienes dudas, consulta los ingredientes, los alérgenos y cualquier advertencia del envase antes de consumirlo.</p>
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-muted">Para una dieta sin gluten, presta atención a ingredientes como trigo, cebada, centeno, malta y avena que no indique expresamente que es sin gluten.</p>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-surface px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Preguntas frecuentes</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Dudas habituales al consultar productos</h2>
          <div className="mt-7 divide-y divide-line border-y border-line">
            {faqs.map(({ question, answer }) => (
              <details key={question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-ink">
                  {question}
                  <span className="text-xl font-normal text-brand-600 transition-transform duration-200 group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-2xl pt-3 text-sm leading-6 text-muted">{answer}</p>
              </details>
            ))}
          </div>
          <div className="mt-8">
            <Link to="/" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-paper transition hover:bg-brand-700 focus:outline-none focus:ring-4 focus:ring-brand-100">
              Consultar un producto ahora
              <SearchIcon />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
