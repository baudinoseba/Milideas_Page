import Link from "next/link";

const PROPOSITOS_VALOR = [
  { emoji: "🎨", titulo: "Arte ilustrado", detalle: "Obras y diseños originales pintados a mano" },
  { emoji: "✨", titulo: "Ediciones limitadas", detalle: "Piezas de autor en pequeños lotes" },
  { emoji: "📦", titulo: "Estrenos mensuales", detalle: "Lanzamientos y piezas de autor" },
  { emoji: "🚚", titulo: "Embalaje y envío seguro", detalle: "Envíos protegidos a todo el país" },
] as const;

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/70 bg-surface/80 transition-colors duration-300">
      {/* ─── 1. Barra de 4 Pilares de Valor ─── */}
      <div className="border-b border-border/50 bg-arena/20 py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-6">
            {PROPOSITOS_VALOR.map((item) => (
              <div key={item.titulo} className="flex items-center gap-2.5 sm:gap-3">
                <span className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-surface border border-border/60 text-base sm:text-lg shadow-2xs">
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

      {/* ─── 2. Renglón Único Minimalista (Copyright + Enlaces en 1 Sola Línea) ─── */}
      <div className="py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-sans text-muted">
          {/* Copyright a la izquierda */}
          <p className="text-[11px] sm:text-xs">
            © {new Date().getFullYear()} Milideas — Sunchales, Santa Fe 🇦🇷
          </p>

          {/* Enlaces de Navegación en el mismo renglón */}
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] sm:text-xs">
            <Link href="/sobre-mi" className="hover:text-chocolate transition-colors font-medium">
              Sobre Mí & FAQ
            </Link>
            <Link href="/ceramica" className="hover:text-chocolate transition-colors">
              Cerámica
            </Link>
            <Link href="/ilustracion" className="hover:text-chocolate transition-colors">
              Ilustración
            </Link>
            <Link href="/obras" className="hover:text-chocolate transition-colors">
              Obras & Proyectos
            </Link>
            <a
              href="https://instagram.com/milideas_arte"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-chocolate transition-colors inline-flex items-center gap-1 text-terracota font-medium"
            >
              <span>@milideas_arte</span>
              <span className="text-[10px]">↗</span>
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
