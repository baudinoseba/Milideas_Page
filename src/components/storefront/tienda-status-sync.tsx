"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTiendaStatusStore } from "@/stores/tienda-status-store";

interface TiendaStatusSyncProps {
  initialStatus: {
    stockCeramicaAbierto: boolean;
    encargosCeramicaAbiertos: boolean;
    stockIlustracionAbierto: boolean;
    encargosIlustracionAbiertos: boolean;
  };
}

export function TiendaStatusSync({ initialStatus }: TiendaStatusSyncProps) {
  const setTiendaStatus = useTiendaStatusStore((s) => s.setTiendaStatus);

  useEffect(() => {
    // 1. Inicializar con los datos autoritativos del servidor
    setTiendaStatus(initialStatus);

    // 2. Suscribirse a cambios en tiempo real en configuracion_sitio
    const supabase = createClient();
    const channel = supabase
      .channel("tienda-status-sync-v2")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "configuracion_sitio",
        },
        (payload) => {
          const row = payload.new as any;
          if (row) {
            setTiendaStatus({
              stockCeramicaAbierto:
                typeof row.stock_ceramica_abierto === "boolean"
                  ? row.stock_ceramica_abierto
                  : undefined,
              encargosCeramicaAbiertos:
                typeof row.encargos_ceramica_abiertos === "boolean"
                  ? row.encargos_ceramica_abiertos
                  : undefined,
              stockIlustracionAbierto:
                typeof row.stock_ilustracion_abierto === "boolean"
                  ? row.stock_ilustracion_abierto
                  : undefined,
              encargosIlustracionAbiertos:
                typeof row.encargos_ilustracion_abiertos === "boolean"
                  ? row.encargos_ilustracion_abiertos
                  : undefined,
            });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "encargos",
        },
        async () => {
          // Cuando otro cliente envía un encargo, refrescar el estado de los interruptores en tiempo real
          try {
            const { data: cfg } = await supabase
              .from("configuracion_sitio")
              .select("stock_ceramica_abierto, encargos_ceramica_abiertos, stock_ilustracion_abierto, encargos_ilustracion_abiertos")
              .limit(1)
              .single();
            if (cfg) {
              setTiendaStatus({
                stockCeramicaAbierto: cfg.stock_ceramica_abierto,
                encargosCeramicaAbiertos: cfg.encargos_ceramica_abiertos,
                stockIlustracionAbierto: cfg.stock_ilustracion_abierto,
                encargosIlustracionAbiertos: cfg.encargos_ilustracion_abiertos,
              });
            }
          } catch {}
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialStatus, setTiendaStatus]);

  return null;
}
