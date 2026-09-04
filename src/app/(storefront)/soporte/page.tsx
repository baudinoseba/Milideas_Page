import { SoporteView } from "@/components/soporte/soporte-view";

export const metadata = {
  title: "Soporte Técnico & Ayuda — Milideas Arte",
  description:
    "Mesa de ayuda y soporte técnico de la plataforma Milideas Arte. Escribinos a soporte@milideasarte.com.ar ante cualquier inconveniente con tu cuenta, compras o inicio de sesión.",
};

export default function SoportePage() {
  return (
    <div className="py-6 sm:py-10">
      <SoporteView />
    </div>
  );
}
