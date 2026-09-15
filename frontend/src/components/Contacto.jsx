import { useState } from 'react';

const contactItems = [
  { label: 'Soporte, privacidad y legal', value: 'celiapp2026@hotmail.com', href: 'mailto:celiapp2026@hotmail.com' },
  { label: 'Ubicación', value: 'Barcelona, España' },
  { label: 'Respuesta', value: 'Próximamente' },
];

const fieldClass = 'w-full box-border rounded-lg border border-ink/15 bg-surface px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-accent/55 focus:ring-4 focus:ring-accent/10';

export default function Contacto() {
  const [notice, setNotice] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setNotice('El envío del formulario estará disponible próximamente. Mientras tanto, escríbenos directamente al correo indicado.');
  };

  return <section id="contacto" className="bg-surface px-4 py-10 sm:py-14 md:py-16 lg:py-20"><div className="mx-auto max-w-[1120px]"><div className="grid items-start gap-8 min-[640px]:grid-cols-2 min-[640px]:gap-[clamp(2rem,5vw,4rem)]"><div className="reveal"><p className="mb-3 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-accent">Contacto</p><h2 className="mb-5 font-display text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em] text-ink">¿Tienes alguna<br />pregunta?</h2><p className="mb-8 text-[0.9375rem] leading-7 text-[#4B6355]">Si tienes dudas sobre un producto, quieres informar de un error, proponer una mejora o hacer una consulta sobre privacidad, puedes escribirnos.</p><div className="flex flex-col gap-5">{contactItems.map(({ label, value, href }) => <div key={label}><p className="mb-1 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-[#4B6355]">{label}</p>{href ? <a href={href} className="text-[0.9375rem] font-semibold text-ink transition-colors hover:text-accent">{value}</a> : <p className="text-[0.9375rem] font-semibold text-ink">{value}</p>}</div>)}</div></div><div className="reveal rounded-xl border border-ink/15 bg-white p-6"><h3 className="mb-1 text-xl font-bold text-ink">Formulario de contacto</h3><p className="mb-5 text-sm leading-6 text-[#4B6355]">El envío desde la web estará disponible próximamente. Si necesitas contactar ahora, usa el correo de la izquierda.</p><form className="flex flex-col gap-4" onSubmit={handleSubmit}><div className="grid gap-4 md:grid-cols-2">{[{ label: 'Nombre', type: 'text', placeholder: 'Tu nombre' }, { label: 'Email', type: 'email', placeholder: 'tu@email.com' }].map((field) => <div key={field.label}><label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.06em] text-[#4B6355]">{field.label}</label><input type={field.type} placeholder={field.placeholder} required className={fieldClass} /></div>)}</div><div><label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.06em] text-[#4B6355]">Asunto</label><select className={fieldClass}><option>Duda sobre un producto</option><option>Reportar un error</option><option>Sugerencia de mejora</option><option>Consulta de privacidad o legal</option><option>Otro</option></select></div><div><label className="mb-1.5 block text-[0.72rem] font-bold uppercase tracking-[0.06em] text-[#4B6355]">Mensaje</label><textarea rows={4} placeholder="Cuéntanos en qué podemos ayudarte…" required className={`${fieldClass} resize-none`} /></div>{notice && <p role="status" className="rounded-lg border border-accent/20 bg-accent/5 px-3.5 py-3 text-sm leading-6 text-[#4B6355]">{notice}</p>}<button type="submit" className="rounded-lg bg-accent px-4 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-green-700">Próximamente disponible</button></form></div></div></div></section>;
}
