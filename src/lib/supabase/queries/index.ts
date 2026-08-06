import { createClient } from "@/lib/supabase/server";
import type {
  Categoria,
  PedidoConItems,
  Perfil,
  ProductoConImagenes,
  ZonaLogistica,
} from "@/types";

export async function getCategorias(): Promise<Categoria[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .order("nombre");
  if (error) throw error;
  return (data ?? []) as Categoria[];
}

export async function getZonasLogisticas(activasOnly = true): Promise<ZonaLogistica[]> {
  const supabase = await createClient();
  let query = supabase.from("configuracion_logistica").select("*").order("zona_nombre");
  if (activasOnly) query = query.eq("activa", true);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ZonaLogistica[];
}

export async function getProductos(filters?: {
  categoriaId?: string;
  dropsOnly?: boolean;
}): Promise<ProductoConImagenes[]> {
  const supabase = await createClient();
  let query = supabase
    .from("productos")
    .select("*, producto_imagenes(*), categorias(*)")
    .eq("activo", true)
    .order("created_at", { ascending: false });

  if (filters?.categoriaId) {
    query = query.eq("categoria_id", filters.categoriaId);
  }

  if (filters?.dropsOnly) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    query = query
      .not("fecha_lanzamiento", "is", null)
      .gte("fecha_lanzamiento", thirtyDaysAgo.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ProductoConImagenes[];
}

export async function getProductoBySlug(slug: string): Promise<ProductoConImagenes | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("productos")
    .select("*, producto_imagenes(*), categorias(*)")
    .eq("slug", slug)
    .eq("activo", true)
    .single();
  if (error) return null;
  return data as ProductoConImagenes;
}

export async function getProductoSlugs(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("productos")
    .select("slug")
    .eq("activo", true);
  if (error) return [];
  return ((data ?? []) as { slug: string }[]).map((p) => p.slug);
}

export async function getDropDestacados(limit = 4): Promise<ProductoConImagenes[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("productos")
    .select("*, producto_imagenes(*), categorias(*)")
    .eq("activo", true)
    .not("fecha_lanzamiento", "is", null)
    .order("fecha_lanzamiento", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ProductoConImagenes[];
}

export async function getPedidoById(id: string): Promise<PedidoConItems | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedidos")
    .select("*, items_pedido(*, productos(*))")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as PedidoConItems;
}

export async function getPedidosUsuario(userId: string): Promise<PedidoConItems[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pedidos")
    .select("*, items_pedido(*, productos(*))")
    .eq("usuario_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PedidoConItems[];
}

export async function getPerfil(userId: string): Promise<Perfil | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data as Perfil;
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const perfil = await getPerfil(userId);
  return perfil?.es_admin ?? false;
}

export async function getAdminPedidos(estado?: string): Promise<PedidoConItems[]> {
  const supabase = await createClient();
  let query = supabase
    .from("pedidos")
    .select("*, items_pedido(*, productos(*))")
    .order("created_at", { ascending: false });
  if (estado) query = query.eq("estado", estado);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PedidoConItems[];
}

export async function getAdminStats() {
  const supabase = await createClient();
  const [pendientes, stockBajo] = await Promise.all([
    supabase
      .from("pedidos")
      .select("id", { count: "exact", head: true })
      .eq("estado", "pendiente_pago"),
    supabase
      .from("productos")
      .select("id", { count: "exact", head: true })
      .lte("stock_disponible", 1)
      .eq("activo", true),
  ]);
  return {
    pedidosPendientes: pendientes.count ?? 0,
    stockBajo: stockBajo.count ?? 0,
  };
}
