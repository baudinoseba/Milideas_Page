import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-muted">
          © {new Date().getFullYear()} Milideas — Cerámica de autor
        </p>
        <div className="flex gap-4 text-sm text-muted">
          <Link href="/catalogo" className="hover:text-foreground">
            Catálogo
          </Link>
          <Link href="/drops" className="hover:text-foreground">
            Drops
          </Link>
        </div>
      </div>
    </footer>
  );
}
