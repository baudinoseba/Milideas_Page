"use client";

import { useState, useEffect } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { formatVendorWhatsapp } from "@/lib/utils/encargos-whatsapp";

/**
 * Hook para obtener el número oficial de WhatsApp de atención cargado en la base de datos (configuracion_sitio).
 * Si se pasa un `initialPhone` desde un Server Component, lo usa inmediatamente.
 * Si no, consulta en segundo plano a Supabase con fallback a "5493493664420".
 */
export function useVendedorWhatsapp(initialPhone?: string | null): string {
  const [phone, setPhone] = useState<string>(() => formatVendorWhatsapp(initialPhone));

  useEffect(() => {
    if (initialPhone) {
      setPhone(formatVendorWhatsapp(initialPhone));
      return;
    }

    let isMounted = true;
    const fetchPhone = async () => {
      try {
        const supabase = createBrowserClient();
        const { data } = await supabase
          .from("configuracion_sitio")
          .select("vendedor_whatsapp")
          .limit(1)
          .maybeSingle();

        if (isMounted && data?.vendedor_whatsapp) {
          setPhone(formatVendorWhatsapp(data.vendedor_whatsapp));
        }
      } catch {
        // Fallback garantizado a 5493493664420
      }
    };

    fetchPhone();

    return () => {
      isMounted = false;
    };
  }, [initialPhone]);

  return phone;
}
