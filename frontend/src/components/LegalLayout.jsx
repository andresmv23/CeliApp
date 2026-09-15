import { NavLink } from 'react-router-dom';

const LEGAL_PATHS = [
  { to: '/privacidad', label: 'Privacidad' },
  { to: '/terminos', label: 'Términos de uso' },
  { to: '/cookies', label: 'Cookies' },
  { to: '/aviso-legal', label: 'Aviso legal' },
];

function Logo() {
  return <NavLink to="/" aria-label="Inicio CeliApp" className="flex shrink-0 items-center gap-2.5 no-underline"><svg className="h-8 w-8" viewBox="0 0 32 32" fill="none" aria-hidden="true"><rect width="32" height="32" rx="9" fill="#16a34a" /><path d="M16 24 L16 10" stroke="white" strokeWidth="1.6" strokeLinecap="round" /><ellipse cx="16" cy="13" rx="3" ry="1.8" fill="white" opacity="0.9" transform="rotate(-30 16 13)" /><ellipse cx="16" cy="13" rx="3" ry="1.8" fill="white" opacity="0.9" transform="rotate(30 16 13)" /><ellipse cx="16" cy="17" rx="3" ry="1.8" fill="white" opacity="0.75" transform="rotate(-20 16 17)" /><ellipse cx="16" cy="17" rx="3" ry="1.8" fill="white" opacity="0.75" transform="rotate(20 16 17)" /><line x1="9" y1="9" x2="23" y2="23" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" /></svg><span className="font-display text-xl font-bold tracking-[-0.01em] text-ink">CeliApp</span></NavLink>;
}

export function LegalFooter() {
  return <footer className="bg-surface"><div className="h-px w-full bg-ink/10" /><div className="mx-auto max-w-[1120px] px-4 py-10 sm:py-12"><div className="mb-8 grid items-start gap-8 sm:grid-cols-2 lg:grid-cols-[minmax(180px,1.5fr)_repeat(3,1fr)]"><div><div className="mb-3.5"><Logo /></div><p className="mb-5 max-w-[220px] text-sm leading-relaxed text-[#4B6355]">Análisis de gluten al instante. Para que comer bien no sea una aventura.</p><span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.07em] text-accent">Sin gluten verificado</span></div><div><p className="mb-4 text-[0.72rem] font-bold uppercase tracking-[0.09em] text-ink/40">Producto</p><div className="flex flex-col gap-2.5"><NavLink to="/como-funciona" className="text-sm text-[#4B6355] transition hover:text-ink">Cómo funciona</NavLink><NavLink to="/" className="text-sm text-[#4B6355] transition hover:text-ink">Verificar producto</NavLink><NavLink to="/" className="text-sm text-[#4B6355] transition hover:text-ink">Análisis por foto</NavLink><NavLink to="/perfil" className="text-sm text-[#4B6355] transition hover:text-ink">Favoritos</NavLink></div></div><div><p className="mb-4 text-[0.72rem] font-bold uppercase tracking-[0.09em] text-ink/40">Empresa</p><div className="flex flex-col gap-2.5"><NavLink to="/sobre-celiapp" className="text-sm text-[#4B6355] transition hover:text-ink">Sobre CeliApp</NavLink><a href="mailto:celiapp2026@hotmail.com" className="text-sm text-[#4B6355] transition hover:text-ink">Contacto</a></div></div><div><p className="mb-4 text-[0.72rem] font-bold uppercase tracking-[0.09em] text-ink/40">Legal</p><div className="flex flex-col gap-2.5">{LEGAL_PATHS.map(({ to, label }) => <NavLink key={to} to={to} className="text-sm text-[#4B6355] transition hover:text-ink">{label}</NavLink>)}</div></div></div><div className="mb-6 h-px bg-ink/10" /><div className="flex flex-col items-start justify-between gap-2 text-[0.8125rem] sm:flex-row sm:flex-wrap"><span className="text-ink/40">© 2026 CeliApp — Hecho con cuidado en Barcelona, España</span><span className="text-ink/35">No sustituye el consejo médico. Verifica siempre el etiquetado.</span></div></div></footer>;
}

export default function LegalPage({ title, children }) {
  return <div className="min-h-screen bg-surface text-ink"><main className="px-4 py-12 sm:py-16"><div className="mx-auto max-w-3xl"><p className="mb-3 text-xs font-bold uppercase tracking-[0.1em] text-accent">Información legal</p><h1 className="mb-4 font-display text-4xl font-bold tracking-[-0.02em] text-ink sm:text-5xl">{title}</h1><p className="mb-9 text-sm text-[#4B6355]">Última actualización: septiembre de 2026</p><article className="rounded-3xl border border-ink/10 bg-white p-6 shadow-[0_4px_24px_rgba(13,31,20,0.06)] sm:p-9"><div className="space-y-7 text-[0.9375rem] leading-7 text-[#4B6355]">{children}</div></article></div></main><LegalFooter /></div>;
}

export function LegalSection({ title, children }) {
  return <section><h2 className="mb-2 font-display text-2xl font-bold text-ink">{title}</h2>{children}</section>;
}

export const ContactEmail = () => <a href="mailto:celiapp2026@hotmail.com" className="font-semibold text-accent underline underline-offset-2 hover:text-green-700">celiapp2026@hotmail.com</a>;
