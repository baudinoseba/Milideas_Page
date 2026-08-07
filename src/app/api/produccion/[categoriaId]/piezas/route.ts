import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isUserAdmin, getPiezasBorrador } from "@/lib/supabase/queries";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ categoriaId: string }> }
) {
  const { categoriaId } = await params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const admin = await isUserAdmin(user.id);
    if (!admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const piezas = await getPiezasBorrador(categoriaId);
    return NextResponse.json(piezas);
  } catch (error) {
    console.error("API GET pieces error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error al obtener las piezas";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
