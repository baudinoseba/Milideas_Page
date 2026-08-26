import Link from "next/link";

const PROPOSITOS_VALOR = [
  { emoji: "🎨", titulo: "Arte ilustrado", detalle: "Obras y diseños originales pintados a mano" },
  { emoji: "✨", titulo: "Ediciones limitadas", detalle: "Piezas de autor en pequeños lotes" },
  { emoji: "📦", titulo: "Colecciones nuevas", detalle: "Lanzamientos y drops periódicos" },
  { emoji: "🚚", titulo: "Embalaje y envío seguro", detalle: "Envíos protegidos a todo el país" },
] as const;

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/70 bg-surface/60 transition-colors duration-300">
      {/* ─── 1. Barra de 4 Pilares de Valor ─── */}
      <div className="border-b border-border/50 bg-arena/25 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {PROPOSITOS_VALOR.map((item) => (
              <div key={item.titulo} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface border border-border/60 text-lg shadow-xs">
                  {item.emoji}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-chocolate truncate">{item.titulo}</p>
                  <p className="text-[11px] text-muted truncate hidden sm:block">{item.detalle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 2. Navegación y Enlaces de Comunidad ─── */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Logo & Subtítulo */}
          <div className="flex items-center gap-3">
            <img
              src="/logo-artistic.jpg"
              alt="Milideas"
              className="h-9 w-auto rounded-lg object-contain shadow-xs"
            />
            <div>
              <p className="text-sm font-semibold text-chocolate font-serif">Milideas</p>
              <p className="text-xs text-muted">Estudio de Cerámica & Arte Ilustrado</p>
            </div>
          </div>

          {/* Links de Navegación Rápida */}
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-sans text-muted">
            <Link href="/ceramica" className="hover:text-chocolate transition-colors">
              Cerámica
            </Link>
            <Link href="/ilustracion" className="hover:text-chocolate transition-colors">
              Ilustración
            </Link>
            <Link href="/obras" className="hover:text-chocolate transition-colors">
              Obras & Proyectos
            </Link>
            <Link href="/cuenta/perfil" className="hover:text-chocolate transition-colors">
              Mi Cuenta
            </Link>
            <a
              href="https://instagram.com/milideas_arte"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-chocolate transition-colors inline-flex items-center gap-1 font-medium"
            >
              <span>Instagram @milideas_arte</span>
              <span className="text-[10px] text-terracota">↗</span>
            </a>
          </nav>
        </div>
      </div>

      {/* ─── 3. Copyright & Sunchales ─── */}
      <div className="border-t border-border/40 bg-arena/20 py-4">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-[11px] text-muted sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Milideas — Hecho con ❤️ en Sunchales, Santa Fe.</p>
          <p className="font-serif italic text-chocolate/80">Arte ilustrado para iluminar tus días.</p>
        </div>
      </div>
    </footer>
  );
}
