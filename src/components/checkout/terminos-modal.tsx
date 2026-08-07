"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface TerminosModalProps {
  open: boolean;
  onClose: () => void;
}

export function TerminosModal({ open, onClose }: TerminosModalProps) {
  const [text, setText] = useState<string>("Cargando términos y condiciones...");

  useEffect(() => {
    if (open) {
      fetch("/terminos-y-condiciones.txt")
        .then((res) => {
          if (!res.ok) throw new Error("No se pudo cargar el archivo");
          return res.text();
        })
        .then((data) => setText(data))
        .catch(() => setText("Error al cargar los términos y condiciones. Por favor, intente nuevamente."));
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Términos y Condiciones">
      <div className="flex flex-col max-h-[60vh]">
        <div className="flex-1 overflow-y-auto pr-2 text-xs text-muted leading-relaxed whitespace-pre-wrap font-sans border border-border p-3 rounded-md bg-background mb-4">
          {text}
        </div>
        <div className="flex justify-end">
          <Button onClick={onClose} type="button" className="px-6">
            Entendido
          </Button>
        </div>
      </div>
    </Modal>
  );
}
