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

function BarcodeIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" d="M4 5v14M7 5v14M10 5v14M13 5v14M17 5v14M20 5v14" /></svg>;
}

const checks = [
  { title: 'Identifica el producto', text: 'El código EAN funciona como identificador del artículo. Al introducirlo o escanearlo, la consulta se realiza sobre ese producto concreto, no sobre una categoría genérica.', icon: <BarcodeIcon /> },
  { title: 'Muestra la información encontrada', text: 'CeliApp presenta los ingredientes y datos disponibles para que puedas ver qué información se ha usado en el resultado.', icon: <SearchIcon /> },
  { title: 'Evita afirmar cuando faltan datos', text: 'Si los datos son incompletos, ambiguos o no permiten una conclusión fiable, CeliApp muestra DUDOSO en lugar de marcar el producto como apto.', icon: <AlertIcon /> },
];

const results = [
  { label: 'APTO', icon: <CheckIcon />, className: 'border-brand-200 bg-brand-50 text-brand-800', description: 'Los datos disponibles no señalan ingredientes con gluten. Aun así, comprueba el envase si han cambiado la receta o tienes alguna duda.' },
  { label: 'NO APTO', icon: <AlertIcon />, className: 'border-red-200 bg-red-50 text-red-900', description: 'Los datos disponibles señalan gluten o un ingrediente que debe evitarse en una dieta sin gluten.' },
  { label: 'DUDOSO', icon: <AlertIcon />, className: 'border-amber-200 bg-amber-50 text-amber-900', description: 'No hay datos suficientes o son poco claros. No se convierte una falta de información en una recomendación positiva.' },
];

const faqs = [
  { question: '¿Por qué un producto puede aparecer como DUDOSO?', answer: 'Porque la aplicación no dispone de ingredientes completos, la información es ambigua o no permite comprobar el producto con seguridad. DUDOSO es una señal para revisar el envase, no una respuesta afirmativa.' },
  { question: '¿Puede cambiar el resultado de un producto?', answer: 'Sí. Los fabricantes pueden modificar recetas, alérgenos, certificaciones o etiquetado. Por eso conviene comprobar el envase de cada unidad que vas a consumir.' },
  { question: '¿Qué información debo revisar en la etiqueta?', answer: 'Revisa la lista de ingredientes, la información de alérgenos y cualquier advertencia. En una dieta sin gluten, presta especial atención al trigo, cebada, centeno, malta y a la avena que no indique expresamente que es sin gluten.' },
  { question: '¿CeliApp sustituye la información del fabricante?', answer: 'No. CeliApp es una herramienta de apoyo para interpretar información. La etiqueta y la información facilitada por el fabricante son la referencia final antes de consumir un producto.' },
];

export default function ComoFunciona() {
  return (
    <main className="bg-paper font-sans text-ink">
      <section className="border-b border-line bg-surface px-4 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Cómo funciona CeliApp</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Cómo evaluamos la información de un producto</h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted">CeliApp está diseñada para que entiendas qué información hay detrás de cada resultado y cuándo debes detenerte a comprobar el envase.</p>
          <Link to="/" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-paper transition hover:-translate-y-0.5 hover:bg-brand-700 hover:shadow-card focus:outline-none focus:ring-4 focus:ring-brand-100">
            <SearchIcon />
            Consultar un producto
          </Link>
        </div>
      </section>

      <section className="px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Transparencia</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Una respuesta útil no es solo un color</h2>
            <p className="mt-3 text-sm leading-6 text-muted">Una aplicación fiable también debe dejar claro sus límites. Por eso CeliApp no pretende sustituir la etiqueta: te ayuda a localizar y entender la información disponible.</p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {checks.map(({ title, text, icon }, index) => (
              <article key={title} className="rounded-2xl border border-line bg-paper p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-card-hover">
                <div className="flex items-center justify-between">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">{icon}</span>
                  <span className="text-xs font-semibold text-brand-600">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="mt-5 text-base font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-3 lg:gap-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Interpretación</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Qué significa cada resultado</h2>
              <p className="mt-3 text-sm leading-6 text-muted">Cada estado comunica un grado de certeza distinto. El objetivo es que sepas cuándo puedes avanzar y cuándo necesitas verificar más información.</p>
            </div>
            <div className="grid gap-4 lg:col-span-2">
              {results.map(({ label, icon, className, description }) => (
                <article key={label} className={`flex gap-4 rounded-xl border p-5 ${className}`}>
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
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Decisión informada</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Por qué el envase sigue siendo esencial</h2>
          </div>
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-cream-300 bg-cream-100 p-5">
              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper text-dudoso"><AlertIcon /></span>
                <div>
                  <p className="text-sm font-semibold text-ink">Las recetas pueden cambiar sin que cambie el código de barras</p>
                  <p className="mt-2 text-sm leading-6 text-muted">Un mismo producto puede modificar sus ingredientes o advertencias con el tiempo. Antes de consumirlo, compara siempre el resultado con la etiqueta de la unidad que tienes delante.</p>
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm leading-6 text-muted">Comprueba los ingredientes, los alérgenos y cualquier advertencia del fabricante. Esta revisión es especialmente importante si el resultado es DUDOSO o si se trata de un producto nuevo para ti.</p>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-surface px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Preguntas frecuentes</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Para quienes quieren saber más</h2>
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
