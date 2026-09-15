const steps = [
  {
    number: '01',
    title: 'Introduce el código',
    description: 'Escribe manualmente el código EAN o usa la cámara para escanearlo directamente desde el envase.',
  },
  {
    number: '02',
    title: 'La IA lo analiza',
    description: 'Nuestra IA revisa cada ingrediente, aditivo y posible traza de gluten en segundos.',
  },
  {
    number: '03',
    title: 'Respuesta clara',
    description: 'Recibes APTO, NO APTO o DUDOSO con la explicación exacta del motivo.',
  },
];

export default function ComoFuncionaPreview() {
  return <section id="como-funciona" className="bg-[#F0F4F1] px-4 py-10 sm:py-14 md:py-16 lg:py-20">
    <div className="mx-auto max-w-[1120px]">
      <div className="reveal mb-10 max-w-[520px]">
        <p className="mb-3 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-accent">Cómo funciona</p>
        <h2 className="font-display text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em] text-ink">Tres pasos.<br />Resultado inmediato.</h2>
      </div>
      <div className="grid border border-ink/15 bg-ink/10 md:grid-cols-3 md:gap-px">
        {steps.map(({ number, title, description }) => <div key={number} className="reveal bg-white px-6 py-7"><span className="mb-4 block text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-accent">{number}</span><h3 className="mb-2 text-base font-bold leading-snug text-ink">{title}</h3><p className="text-sm leading-relaxed text-[#4B6355]">{description}</p></div>)}
      </div>
    </div>
  </section>;
}
