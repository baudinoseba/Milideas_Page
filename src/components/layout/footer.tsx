import Link from "next/link";

function IconTruck() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="2" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function IconHeart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

const TRUST_SIGNALS = [
  { icon: IconTruck, label: "Envíos protegidos a todo el país" },
  { icon: IconShield, label: "Embalaje antigolpes garantizado" },
  { icon: IconHeart, label: "Piezas únicas ilustradas a mano" },
] as const;

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/80 bg-gradient-to-b from-transparent to-arena/40">
      {/* Trust signals bar */}
      <div className="border-b border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-8 sm:flex-row sm:justify-around sm:px-6">
          {TRUST_SIGNALS.map((signal) => (
            <div key={signal.label} className="flex items-center gap-3 text-sm font-medium text-foreground/80">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rosa-buho/20 text-terracota">
                <signal.icon />
              </span>
              <span>{signal.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer content */}
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="space-y-3 sm:max-w-md">
          <Link href="/" className="inline-flex items-center gap-3 text-2xl font-semibold tracking-tight text-chocolate font-serif hover:opacity-90 transition-opacity">
            <img src="/logo-artistic.jpg" alt="Milideas" className="h-10 w-auto rounded-lg object-contain" />
            <span>Milideas</span>
          </Link>
          <p className="text-sm leading-relaxed text-muted">
            Cerámica de autor ilustrada por <strong className="font-semibold text-chocolate">Mili Ferrero</strong>. Cada pieza es moldeada y pintada a mano en ediciones limitadas desde Sunchales, Santa Fe, Argentina.
          </p>
          <p className="font-handwritten text-lg text-terracota pt-1">
            "Donde el barro cobra vida y cada pieza te mira de vuelta."
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 text-sm">
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-barro font-sans">Navegación</p>
            <ul className="space-y-2">
              <li>
                <Link href="/catalogo" className="text-muted transition-colors hover:text-chocolate font-medium">
                  Catálogo completo
                </Link>
              </li>
              <li>
                <Link href="/colecciones" className="text-muted transition-colors hover:text-chocolate font-medium">
                  Colecciones & Lanzamientos
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-muted transition-colors hover:text-chocolate font-medium">
                  Mi Cuenta
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-barro font-sans">Comunidad</p>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://instagram.com/milideas_arte"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-muted transition-colors hover:text-chocolate font-medium"
                >
                  <span>@milideas_arte</span>
                  <span className="text-xs text-terracota">↗</span>
                </a>
              </li>
              <li className="text-xs text-muted leading-relaxed">
                Sunchales, Santa Fe, AR
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border/60 bg-arena/30">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} Milideas — Hecho con ❤️ en Sunchales, Santa Fe
          </p>
          <p className="text-xs text-barro font-sans">
            Arte ilustrado para iluminar tus días
          </p>
        </div>
      </div>
    </footer>
  );
}

