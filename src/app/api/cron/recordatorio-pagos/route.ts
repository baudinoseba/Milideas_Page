import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { notificarRecordatorioPagoAdmin } from "@/lib/email/send-notifications";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Supabase credentials not configured.");
  }
  return createSupabaseClient(supabaseUrl, serviceKey);
}

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  try {
    // 1. Authorization check via header or query param
    const authHeader = req.headers.get("authorization");
    const urlSecret = req.nextUrl.searchParams.get("secret");
    const expectedSecret = process.env.CRON_SECRET;

    const providedToken = authHeader?.replace(/^Bearer\s+/i, "") || urlSecret;

    if (expectedSecret && providedToken !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 2. Compute 24h threshold timestamp
    const threshold24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // 3. Find pending unpaid orders that reached 24h and haven't been notified
    const { data: pedidos, error: fetchErr } = await supabase
      .from("pedidos")
      .select("*, items_pedido(*, productos(nombre))")
      .in("estado", ["reservado", "pendiente_pago"])
      .is("comprobante_url", null)
      .lte("created_at", threshold24h)
      .or("recordatorio_24h_enviado.is.null,recordatorio_24h_enviado.eq.false");

    if (fetchErr) {
      console.error("[Cron Recordatorio Pagos] Error fetching orders:", fetchErr);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!pedidos || pedidos.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No hay pedidos pendientes de 24h para notificar.",
        processedCount: 0,
      });
    }

    let processedCount = 0;
    let errorCount = 0;

    for (const pedido of pedidos) {
      const emailSent = await notificarRecordatorioPagoAdmin(pedido);
      if (emailSent) {
        // Mark order as notified so we don't send multiple reminder emails
        await supabase
          .from("pedidos")
          .update({ recordatorio_24h_enviado: true })
          .eq("id", pedido.id);
        processedCount++;
      } else {
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processedCount,
      errorCount,
      totalFound: pedidos.length,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal error";
    console.error("[Cron Recordatorio Pagos] Error in execution:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
