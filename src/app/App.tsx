import { useState } from 'react';

const sections = [
  { id: 'home', label: 'Inicio', symbol: '⌂' },
  { id: 'mix', label: 'Crear mezcla', symbol: '◉' },
  { id: 'paints', label: 'Mis pinturas', symbol: '▣' },
  { id: 'recipes', label: 'Mis recetas', symbol: '▤' },
  { id: 'settings', label: 'Configuración', symbol: '⚙' },
] as const;

type Section = typeof sections[number]['id'];

export function App() {
  const [section, setSection] = useState<Section>('home');

  return <div className="app-shell">
    <header className="topbar"><div className="brand-mark">O</div><div className="brand"><strong>OleoPalette</strong><span>TU TALLER DE COLOR</span></div><div className="topbar-accent" aria-hidden="true">✦</div></header>
    <main id="main-content" className="content">
      {section === 'home' && <section className="home"><div className="eyebrow">EL COLOR EMPIEZA AQUÍ</div><h1>Tu próximo color,<br /><em>mezclado por ti.</em></h1><p className="intro">Elige un tono de tu foto y descubre cómo acercarte a él con las pinturas que tienes.</p><button className="primary-action" onClick={() => setSection('mix')}>Crear una mezcla <span aria-hidden="true">→</span></button><div className="hero-card" aria-hidden="true"><div className="paint-stroke stroke-1" /><div className="paint-stroke stroke-2" /><div className="paint-stroke stroke-3" /><div className="palette-circle"><i /><i /><i /><i /></div></div><div className="section-heading"><span>ASÍ DE SIMPLE</span><h2>De la inspiración al lienzo</h2></div><div className="steps"><article><b>01</b><h3>Encuentra el color</h3><p>Elige una foto y toca el tono que te inspira.</p></article><article><b>02</b><h3>Explora mezclas</h3><p>Busca con tus pinturas o una paleta sugerida.</p></article><article><b>03</b><h3>Pinta a tu manera</h3><p>Prepara una pequeña muestra y ajusta a ojo.</p></article></div></section>}
      {section !== 'home' && <section className="page"><div className="eyebrow">TU TALLER</div><h1>{sections.find((item) => item.id === section)?.label}</h1><p className="intro">Prepara tus colores con calma y confianza.</p></section>}
    </main>
    <nav className="bottom-nav" aria-label="Navegación principal">{sections.map((item) => <button key={item.id} type="button" aria-current={section === item.id ? 'page' : undefined} onClick={() => setSection(item.id)}><span className="nav-symbol" aria-hidden="true">{item.symbol}</span><span>{item.label}</span></button>)}</nav>
  </div>;
}
