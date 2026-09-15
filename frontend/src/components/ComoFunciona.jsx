import { Link } from 'react-router-dom';

function SearchIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m2.1-5.4a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" /></svg>;
}

function CheckIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12.75l4.5 4.5L19 7.75" /></svg>;
}

function AlertIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3h.008M10.29 3.86L2.82 16.33A2.25 2.25 0 004.75 19.7h14.5a2 2 0 001.93-3L13.71 3.86a2.25 2.25 0 00-3.42 0z" /></svg>;
}

function DatabaseIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><ellipse cx="12" cy="5" rx="7" ry="3" /><path strokeLinecap="round" strokeLinejoin="round" d="M5 5v7c0 1.66 3.13 3 7 3s7-1.34 7-3V5M5 12v7c0 1.66 3.13 3 7 3s7-1.34 7-3v-7" /></svg>;
}

function GlobeIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></svg>;
}

function CameraIcon() {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 0 1 9 0z" /></svg>;
}

function ArrowIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>;
}

const sources = [
  { icon: <DatabaseIcon />, title: 'Open Food Facts', text: 'La consulta comienza con el código EAN. CeliApp pregunta a la API pública de Open Food Facts si dispone de una ficha para ese producto y, cuando existe, recupera los datos disponibles: nombre, marca, foto, ingredientes y declaraciones.' },
  { icon: <GlobeIcon />, title: 'Información pública en internet', text: 'Si Open Food Facts no encuentra el producto, CeliApp busca el EAN en fuentes públicas. Puede localizar fichas en la web oficial de la marca, tiendas y supermercados, además de otros sitios donde el producto se comercializa.' },
  { icon: <CameraIcon />, title: 'Foto y lectura asistida por IA', text: 'Cuando la identificación no es suficientemente clara, la aplicación puede pedir una foto del envase. La IA ayuda a reconocer el producto y a leer texto relevante: ingredientes, alérgenos y declaraciones como “sin gluten”.' },
];

const stages = [
  { number: '01', title: 'Identificar exactamente el producto', text: 'El EAN no se usa como una búsqueda genérica: permite intentar localizar la referencia concreta que el usuario tiene delante. Si la búsqueda externa devuelve varias coincidencias, se muestran candidatos para que el usuario elija el producto correcto antes de continuar.' },
  { number: '02', title: 'Reunir la información disponible', text: 'La aplicación combina los datos recuperados de Open Food Facts con la información pública encontrada en la búsqueda cuando es necesaria. También puede apoyarse en los Excel de productos disponibles para completar la consulta. El objetivo es trabajar con datos del producto, no con suposiciones por categoría.' },
  { number: '03', title: 'Analizar ingredientes y declaraciones', text: 'CeliApp comprueba ingredientes incluidos en su lista de gluten y falsos positivos. Si detecta gluten o trazas declaradas, el resultado es NO APTO. Cuando hay términos ambiguos, como ingredientes cuyo origen no queda claro, se activa una comprobación adicional en fuentes públicas.' },
  { number: '04', title: 'Buscar confirmación antes de afirmar', text: 'La comprobación adicional busca declaraciones oficiales como “sin gluten” y señales de trazas o contaminación cruzada. Una declaración oficial verificable junto con ingredientes compatibles permite un APTO. Si no puede verificarse, la app no convierte la ausencia de datos en una garantía.' },
];

const results = [
  { label: 'APTO', className: 'border-green-200 bg-green-50 text-green-900', icon: <CheckIcon />, text: 'Se han encontrado ingredientes compatibles y una declaración oficial verificable de “sin gluten”. No significa que la aplicación sustituya el envase: la receta puede cambiar.' },
  { label: 'NO APTO', className: 'border-red-200 bg-red-50 text-red-900', icon: <AlertIcon />, text: 'Se ha detectado gluten en los ingredientes, una declaración de trazas o información que indica que el producto debe evitarse en una dieta sin gluten.' },
  { label: 'DUDOSO', className: 'border-amber-200 bg-amber-50 text-amber-900', icon: <AlertIcon />, text: 'No se ha identificado el producto con suficiente claridad o no existen datos verificables. Es un resultado de prudencia, no una recomendación positiva.' },
];

const faqs = [
  { question: '¿Qué fuentes puede consultar CeliApp?', answer: 'La primera fuente es la API pública de Open Food Facts. Si no encuentra el producto o faltan datos, puede buscar información pública asociada al EAN, al nombre y a la marca: web del fabricante, tiendas, supermercados y otras páginas de venta. También puede utilizar los Excel de productos disponibles.' },
  { question: '¿Para qué se utiliza la IA?', answer: 'La IA se utiliza como ayuda cuando hace falta identificar mejor un producto o leer su envase. Puede trabajar con la foto, el nombre, la marca y el texto visible para extraer ingredientes, alérgenos y declaraciones. No reemplaza la comprobación final de la etiqueta.' },
  { question: '¿Qué ocurre si los ingredientes son ambiguos?', answer: 'Cuando un ingrediente no permite una conclusión clara, CeliApp busca confirmación adicional en fuentes públicas. Si no puede confirmar que es apto o encuentra señales de gluten o trazas, no presenta el producto como una opción segura.' },
  { question: '¿Por qué debo revisar el envase si aparece APTO?', answer: 'Porque las recetas, advertencias y certificados pueden cambiar sin que cambie el EAN. La etiqueta de la unidad que vas a consumir y la información del fabricante son siempre la referencia final.' },
];

export default function ComoFunciona() {
  return (
    <main className="bg-paper font-sans text-ink">
      <section className="border-b border-line bg-surface px-4 py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Transparencia en cada consulta</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-5xl">Cómo comprueba CeliApp si un producto puede contener gluten</h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted">No mostramos solo un color. Te contamos qué fuentes se consultan, cómo se analiza la información y por qué a veces la respuesta más responsable es “DUDOSO”.</p>
          <Link to="/" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-paper transition-colors duration-200 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-100">
            <SearchIcon />
            Consultar un producto
          </Link>
        </div>
      </section>

      <section className="px-4 py-14 sm:py-20">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-accent">El punto de partida</p><h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Todo empieza con el EAN del producto</h2></div>
          <div className="space-y-5 text-base leading-7 text-muted"><p>Cuando introduces o escaneas un EAN, CeliApp inicia una consulta para identificar exactamente el producto. Primero pregunta a la API pública de Open Food Facts, una base de datos colaborativa de productos alimentarios.</p><p>Si encuentra una ficha, recupera la información disponible —como nombre, marca, ingredientes, fotografía y declaraciones— y comienza el análisis. Si no la encuentra, no se detiene: activa una búsqueda alternativa para intentar localizar esa misma referencia en otras fuentes públicas.</p></div>
        </div>
      </section>

      <section className="border-y border-line bg-surface px-4 py-14 sm:py-20">
        <div className="mx-auto max-w-5xl"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-wide text-accent">Fuentes de información</p><h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Qué consulta CeliApp y cuándo</h2><p className="mt-4 text-base leading-7 text-muted">Las fuentes se usan de forma progresiva: primero se intenta resolver la consulta con datos estructurados y, si no bastan, se buscan pruebas adicionales del producto concreto.</p></div><div className="mt-10 divide-y divide-line border-y border-line">{sources.map(({ icon, title, text }, index) => <article key={title} className="grid gap-4 py-7 sm:grid-cols-[56px_0.65fr_1.35fr] sm:items-start sm:gap-6"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-100 text-accent">{icon}</span><div className="flex items-center gap-3"><span className="text-xs font-semibold text-accent">{String(index + 1).padStart(2, '0')}</span><h3 className="text-base font-semibold text-ink">{title}</h3></div><p className="text-sm leading-6 text-muted">{text}</p></article>)}</div></div>
      </section>

      <section className="px-4 py-14 sm:py-20"><div className="mx-auto max-w-5xl"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-wide text-accent">El análisis</p><h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">De los datos al resultado, sin atajos</h2><p className="mt-4 text-base leading-7 text-muted">Este es el recorrido que sigue la información antes de mostrar una respuesta. Se prioriza la prudencia por encima de dar una respuesta rápida sin respaldo.</p></div><ol className="mt-10 border-l border-green-200 pl-6 sm:pl-10">{stages.map(({ number, title, text }, index) => <li key={number} className="relative pb-10 last:pb-0"><span className="absolute -left-[38px] flex h-6 w-6 items-center justify-center rounded-full border-4 border-paper bg-accent text-[9px] font-bold text-paper sm:-left-[52px]">{index + 1}</span><p className="text-xs font-semibold tracking-wide text-accent">{number}</p><h3 className="mt-1 text-lg font-semibold text-ink">{title}</h3><p className="mt-2 max-w-3xl text-sm leading-7 text-muted">{text}</p></li>)}</ol></div></section>

      <section className="border-y border-line bg-surface px-4 py-14 sm:py-20"><div className="mx-auto max-w-5xl"><div className="grid gap-8 lg:grid-cols-3 lg:gap-14"><div><p className="text-xs font-semibold uppercase tracking-wide text-accent">El resultado</p><h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Qué significa cada estado</h2><p className="mt-4 text-sm leading-6 text-muted">El resultado expresa tanto lo encontrado como el nivel de certeza de la información disponible.</p></div><div className="grid gap-3 lg:col-span-2">{results.map(({ label, className, icon, text }) => <article key={label} className={`flex gap-4 rounded-lg border p-4 sm:p-5 ${className}`}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper/80">{icon}</span><div><h3 className="text-sm font-bold">{label}</h3><p className="mt-1 text-sm leading-6 opacity-85">{text}</p></div></article>)}</div></div></div></section>

      <section className="px-4 py-14 sm:py-20"><div className="mx-auto max-w-3xl"><p className="text-xs font-semibold uppercase tracking-wide text-accent">Preguntas frecuentes</p><h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Lo que debes saber antes de decidir</h2><div className="mt-8 divide-y divide-line border-y border-line">{faqs.map(({ question, answer }) => <details key={question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-ink"><span>{question}</span><span className="text-xl font-normal text-accent transition-transform duration-200 group-open:rotate-45">+</span></summary><p className="max-w-2xl pt-3 text-sm leading-7 text-muted">{answer}</p></details>)}</div><div className="mt-8 rounded-lg border border-green-200 bg-green-50 p-5"><div className="flex gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper text-accent"><AlertIcon /></span><div><p className="text-sm font-semibold text-ink">La etiqueta del envase sigue siendo la referencia final</p><p className="mt-1 text-sm leading-6 text-muted">Las recetas, advertencias y certificados pueden cambiar. Antes de consumir un producto, revisa siempre la información de la unidad que tienes delante.</p></div></div></div><Link to="/" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors duration-200 hover:text-green-700 focus:outline-none focus:underline">Consultar un producto <ArrowIcon /></Link></div></section>
    </main>
  );
}
