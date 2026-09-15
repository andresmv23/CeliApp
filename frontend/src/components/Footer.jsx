import { NavLink } from 'react-router-dom';

const productLinks = [
  { label: 'Cómo funciona', to: '/como-funciona' },
  { label: 'Verificar producto', to: '/' },
  { label: 'Análisis por foto', to: '/' },
  { label: 'Favoritos', to: '/perfil' },
];

const legalLinks = [
  { label: 'Privacidad', to: '/privacidad' },
  { label: 'Términos de uso', to: '/terminos' },
  { label: 'Cookies', to: '/cookies' },
  { label: 'Aviso legal', to: '/aviso-legal' },
];

function Brand() {
  return <NavLink to="/" aria-label="Inicio CeliApp" className="flex w-fit items-center gap-3 no-underline"><svg className="h-7 w-7" viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#16a34a" /><path d="M16 24 L16 10" stroke="white" strokeWidth="1.6" strokeLinecap="round" /><ellipse cx="16" cy="13" rx="3" ry="1.8" fill="white" opacity="0.9" transform="rotate(-30 16 13)" /><ellipse cx="16" cy="13" rx="3" ry="1.8" fill="white" opacity="0.9" transform="rotate(30 16 13)" /><ellipse cx="16" cy="17" rx="3" ry="1.8" fill="white" opacity="0.75" transform="rotate(-20 16 17)" /><ellipse cx="16" cy="17" rx="3" ry="1.8" fill="white" opacity="0.75" transform="rotate(20 16 17)" /><line x1="9" y1="9" x2="23" y2="23" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" /></svg><span className="font-display text-base font-bold text-ink">CeliApp</span></NavLink>;
}

function FooterColumn({ title, children }) {
  return <div><p className="mb-4 text-[0.72rem] font-bold uppercase tracking-[0.09em] text-ink/40">{title}</p><div className="flex flex-col gap-2.5">{children}</div></div>;
}

const linkClass = 'text-sm text-[#4B6355] transition hover:text-ink';

export default function Footer() {
  return <footer className="bg-surface"><div className="h-px w-full bg-ink/10" /><div className="mx-auto max-w-[1120px] px-4 py-10 sm:py-12"><div className="mb-10 grid items-start gap-8 sm:grid-cols-2 lg:grid-cols-[minmax(180px,1.5fr)_repeat(3,1fr)]"><div><div className="mb-3.5"><Brand /></div><p className="mb-5 max-w-[220px] text-sm leading-relaxed text-[#4B6355]">Análisis de gluten al instante. Para que comer bien no sea una aventura.</p><span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.07em] text-accent"><svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" aria-hidden="true"><circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1" /><path d="M3.5 6l1.8 1.8L8.5 4.2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>Sin gluten verificado</span></div><FooterColumn title="Producto">{productLinks.map(({ label, to }) => <NavLink key={label} to={to} className={linkClass}>{label}</NavLink>)}</FooterColumn><FooterColumn title="Empresa"><NavLink to="/sobre-celiapp" className={linkClass}>Sobre CeliApp</NavLink><a href="#contacto" className={linkClass}>Contacto</a></FooterColumn><FooterColumn title="Legal">{legalLinks.map(({ label, to }) => <NavLink key={label} to={to} className={linkClass}>{label}</NavLink>)}</FooterColumn></div><div className="mb-6 h-px bg-ink/10" /><div className="flex flex-col items-start justify-between gap-2 text-[0.8125rem] sm:flex-row sm:flex-wrap"><span className="text-ink/40">© 2026 CeliApp — Hecho con cuidado en Barcelona, España</span><span className="text-ink/35">No sustituye el consejo médico. Verifica siempre el etiquetado.</span></div></div></footer>;
}
