"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-16 text-center">
      <h2 className="mb-2 text-lg font-medium">Algo salió mal</h2>
      <p className="mb-6 text-sm text-muted">
        No pudimos cargar esta página. Intentá de nuevo.
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
