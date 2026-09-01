import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
import type {
  Categoria,
  ConfiguracionSitio,
  PedidoConItems,
  Perfil,
  ProductoConImagenes,
  ZonaLogistica,
  TipoCatalogo,
  ConfiguracionEncargos,
  Encargo,
  FormatoCatalogo,
  PortfolioColeccion,
  ObraProyecto,
  CategoriaObra,
} from "@/types";

export async function getCategorias(tipoCatalogo?: TipoCatalogo): Promise<Categoria[]> {
  const supabase = await createClient();
  let query = supabase
    .from("categorias")
    .select("*")
    .order("nombre");

  if (tipoCatalogo) {
    query = query.eq("tipo_catalogo", tipoCatalogo);
  }

  const { data, error } = await query;
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

export async function getProducciones(): Promise<Array<{ id: string; nombre: string; descripcion?: string | null }>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("producciones")
    .select("id, nombre, descripcion")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function getProductos(filters?: {
  categoriaId?: string;
  tipoCatalogo?: TipoCatalogo;
  dropsOnly?: boolean;
  coleccionesFilter?: "actual" | "pasadas" | "todas";
  includeInactive?: boolean;
}): Promise<ProductoConImagenes[]> {
  const supabase = await createClient();
  let query = supabase
    .from("productos")
    .select("*, producto_imagenes(*), categorias(*), producciones(*)")
    .order("created_at", { ascending: false });

  if (!filters?.includeInactive) {
    query = query.eq("activo", true);
  }

  if (filters?.tipoCatalogo) {
    query = query.eq("tipo_catalogo", filters.tipoCatalogo);
  }

  if (filters?.categoriaId) {
    query = query.eq("categoria_id", filters.categoriaId);
  }

  const filter = filters?.coleccionesFilter ?? (filters?.dropsOnly ? "actual" : undefined);

  if (filter === "actual") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    query = query
      .not("fecha_lanzamiento", "is", null)
      .gte("fecha_lanzamiento", thirtyDaysAgo.toISOString());
  } else if (filter === "pasadas") {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    query = query
      .not("fecha_lanzamiento", "is", null)
      .lt("fecha_lanzamiento", thirtyDaysAgo.toISOString());
  } else if (filter === "todas") {
    query = query.not("fecha_lanzamiento", "is", null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ProductoConImagenes[];
}

export async function getProductoBySlug(slug: string): Promise<ProductoConImagenes | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("productos")
    .select("*, producto_imagenes(*), categorias(*), producciones(*)")
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

export async function getColeccionDestacados(limit = 4): Promise<ProductoConImagenes[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("productos")
    .select("*, producto_imagenes(*), categorias(*), producciones(*)")
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
    .select("*, items_pedido(*, productos(*, producto_imagenes(*), categorias(*), producciones(*)))")
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
  // Use admin client to bypass RLS for profile lookups
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) {
    console.error("getPerfil error for user", userId, ":", error);
    return null;
  }
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
    .select("*, items_pedido(*, productos(*, producto_imagenes(*)))")
    .order("created_at", { ascending: false });
  if (estado) query = query.eq("estado", estado);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PedidoConItems[];
}

export async function getAdminStats() {
  const supabase = await createClient();
  const [
    pendientes,
    confirmados,
    confirmadosRetiro,
    confirmadosEnvio,
    stockTotalResult,
    ultimosPedidosResult,
    encargosPendientes,
    ultimosEncargosResult,
  ] = await Promise.all([
    supabase
      .from("pedidos")
      .select("id", { count: "exact", head: true })
      .eq("estado", "pendiente_pago"),
    supabase
      .from("pedidos")
      .select("id", { count: "exact", head: true })
      .eq("estado", "confirmado"),
    supabase
      .from("pedidos")
      .select("id", { count: "exact", head: true })
      .eq("estado", "confirmado")
      .ilike("tipo_envio", "%retiro%"),
    supabase
      .from("pedidos")
      .select("id", { count: "exact", head: true })
      .eq("estado", "confirmado")
      .not("tipo_envio", "ilike", "%retiro%"),
    supabase
      .from("productos")
      .select("stock_disponible")
      .eq("activo", true),
    supabase
      .from("pedidos")
      .select("*, items_pedido(*, productos(*, producto_imagenes(*)))")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("encargos")
      .select("id", { count: "exact", head: true })
      .eq("estado", "pendiente"),
    supabase
      .from("encargos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const totalStockPiezas = (stockTotalResult.data || []).reduce(
    (acc, p) => acc + (p.stock_disponible || 0),
    0,
  );

  return {
    pedidosPendientes: pendientes.count ?? 0,
    pedidosConfirmados: confirmados.count ?? 0,
    pedidosRetiroTaller: confirmadosRetiro.count ?? 0,
    pedidosEnvioDomicilio: confirmadosEnvio.count ?? 0,
    totalStockPiezas,
    encargosPendientes: encargosPendientes.count ?? 0,
    ultimosPedidos: (ultimosPedidosResult.data ?? []) as any[],
    ultimosEncargos: (ultimosEncargosResult.data ?? []) as any[],
  };
}

// ─── Production Workflow Queries ───

export async function getPiezasBorrador(categoriaId: string): Promise<ProductoConImagenes[]> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("productos")
    .select("*, producto_imagenes(*), categorias(*), producciones(*)")
    .eq("categoria_id", categoriaId)
    .eq("activo", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getPiezasBorrador error:", error);
    return [];
  }
  return (data ?? []) as ProductoConImagenes[];
}

export async function getProduccionesEnProgreso(): Promise<
  Array<{ id: string; nombre: string; piezas_borrador: number }>
> {
  const adminClient = createAdminClient();

  // Get categories that have at least one draft product
  const { data: productos, error } = await adminClient
    .from("productos")
    .select("categoria_id, categorias(id, nombre)")
    .eq("activo", false)
    .not("categoria_id", "is", null);

  if (error || !productos) {
    console.error("getProduccionesEnProgreso error:", error);
    return [];
  }

  // Group by category and count drafts
  const categoryMap = new Map<string, { id: string; nombre: string; count: number }>();
  for (const p of productos) {
    const cat = p.categorias as unknown as { id: string; nombre: string } | null;
    if (!cat) continue;
    const existing = categoryMap.get(cat.id);
    if (existing) {
      existing.count++;
    } else {
      categoryMap.set(cat.id, { id: cat.id, nombre: cat.nombre, count: 1 });
    }
  }

  return Array.from(categoryMap.values()).map((c) => ({
    id: c.id,
    nombre: c.nombre,
    piezas_borrador: c.count,
  }));
}

export async function getTodasLasPiezasCategoria(categoriaId: string): Promise<ProductoConImagenes[]> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("productos")
    .select("*, producto_imagenes(*), categorias(*), producciones(*)")
    .eq("categoria_id", categoriaId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getTodasLasPiezasCategoria error:", error);
    return [];
  }
  return (data ?? []) as ProductoConImagenes[];
}

export async function getTodosLosProductosCatalog(): Promise<ProductoConImagenes[]> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("productos")
    .select("*, producto_imagenes(*), categorias(*), producciones(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getTodosLosProductosCatalog error:", error);
    return [];
  }
  return (data ?? []) as ProductoConImagenes[];
}


export async function getConfiguracionSitio(): Promise<ConfiguracionSitio> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("configuracion_sitio")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) {
    return {
      id: "default",
      logo_url: null,
      hero_titulo: "Piezas únicas, hechas a mano.",
      hero_subtitulo: "Cerámica de autor en ediciones limitadas. Cada lanzamiento es único y las piezas se agotan rápidamente.",
      hero_imagen_url: null,
      coleccion_destacada_id: null,
    };
  }
  return data as ConfiguracionSitio;
}

export async function getTodasLasPiezasProduccion(produccionId: string): Promise<ProductoConImagenes[]> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("productos")
    .select("*, producto_imagenes(*), categorias(*), producciones(*)")
    .eq("produccion_id", produccionId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getTodasLasPiezasProduccion error:", error);
    return [];
  }
  return (data ?? []) as ProductoConImagenes[];
}

export async function getProduccionById(produccionId: string): Promise<{ id: string; nombre: string } | null> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("producciones")
    .select("id, nombre")
    .eq("id", produccionId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getProduccionesCompletas(): Promise<
  Array<{
    id: string;
    nombre: string;
    total_piezas: number;
    piezas_activas: number;
    piezas_borrador: number;
    created_at: string;
  }>
> {
  const adminClient = createAdminClient();
  const { data: producciones, error: prodError } = await adminClient
    .from("producciones")
    .select("id, nombre, created_at")
    .order("created_at", { ascending: false });

  if (prodError || !producciones) return [];

  const { data: productos } = await adminClient
    .from("productos")
    .select("produccion_id, activo");

  const produccionesMap = new Map<
    string,
    { id: string; nombre: string; created_at: string; total: number; activas: number; borrador: number }
  >();

  for (const p of producciones) {
    produccionesMap.set(p.id, {
      id: p.id,
      nombre: p.nombre,
      created_at: p.created_at,
      total: 0,
      activas: 0,
      borrador: 0,
    });
  }

  if (productos) {
    for (const prod of productos) {
      if (!prod.produccion_id) continue;
      const item = produccionesMap.get(prod.produccion_id);
      if (item) {
        item.total++;
        if (prod.activo) item.activas++;
        else item.borrador++;
      }
    }
  }

  return Array.from(produccionesMap.values()).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    total_piezas: p.total,
    piezas_activas: p.activas,
    piezas_borrador: p.borrador,
    created_at: p.created_at,
  }));
}

export async function getHeroProductos(destacadaId?: string | null): Promise<ProductoConImagenes[]> {
  const supabase = await createClient();

  if (destacadaId) {
    // 1. Try by produccion_id first
    const { data: byProd } = await supabase
      .from("productos")
      .select("*, producto_imagenes(*), categorias(*), producciones(*)")
      .eq("produccion_id", destacadaId)
      .eq("activo", true)
      .order("created_at", { ascending: false });

    if (byProd && byProd.length > 0) {
      return byProd as ProductoConImagenes[];
    }

    // 2. Try by categoria_id
    const { data: byCat } = await supabase
      .from("productos")
      .select("*, producto_imagenes(*), categorias(*), producciones(*)")
      .eq("categoria_id", destacadaId)
      .eq("activo", true)
      .order("created_at", { ascending: false });

    if (byCat && byCat.length > 0) {
      return byCat as ProductoConImagenes[];
    }
  }

  // 3. Fallback: return active products ordered by created_at
  const { data: latest } = await supabase
    .from("productos")
    .select("*, producto_imagenes(*), categorias(*), producciones(*)")
    .eq("activo", true)
    .order("created_at", { ascending: false })
    .limit(10);

  return (latest ?? []) as ProductoConImagenes[];
}

export async function getConfiguracionEncargos(): Promise<ConfiguracionEncargos> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("configuracion_encargos")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) {
    return {
      id: "e2000000-0000-4000-8000-000000000001",
      medidas_ilustraciones: [
        { id: "a4", nombre: "A4 (21 x 30 cm)", recargo: 0 },
        { id: "a3", nombre: "A3 (30 x 42 cm)", recargo: 5000 },
        { id: "large", nombre: "Grand Format (50 x 70 cm)", recargo: 12000 },
      ],
      precio_marco_madera: 8500,
      porcentaje_recargo_personalizado: 0.15,
      demora_default_dias: 15,
    };
  }

  return data as ConfiguracionEncargos;
}

export async function getEncargos(estado?: string): Promise<Encargo[]> {
  const adminClient = createAdminClient();
  let query = adminClient
    .from("encargos")
    .select("*, productos(*, producto_imagenes(*)), items_encargo(*)")
    .order("created_at", { ascending: false });

  if (estado) {
    query = query.eq("estado", estado);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getEncargos error:", error);
    return [];
  }
  return (data ?? []) as Encargo[];
}

export async function getEncargoById(id: string): Promise<Encargo | null> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("encargos")
    .select("*, productos(*, producto_imagenes(*))")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Encargo;
}

// ─── Formatos de Catálogo Base (Mates, Cuencos, Bandejas, etc.) ───

export async function getFormatosCatalogo(rubro: "ceramica" | "ilustracion" = "ceramica"): Promise<FormatoCatalogo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("formatos_catalogo")
    .select("*")
    .eq("rubro", rubro)
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (error) {
    console.error("getFormatosCatalogo error:", error);
    return [];
  }
  return (data ?? []) as FormatoCatalogo[];
}

export async function getFormatosCatalogoAdmin(rubro?: "ceramica" | "ilustracion"): Promise<FormatoCatalogo[]> {
  const adminClient = createAdminClient();
  let query = adminClient
    .from("formatos_catalogo")
    .select("*")
    .order("orden", { ascending: true });

  if (rubro) {
    query = query.eq("rubro", rubro);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getFormatosCatalogoAdmin error:", error);
    return [];
  }
  return (data ?? []) as FormatoCatalogo[];
}

// ─── Portfolio de Colecciones ───

export async function getPortfolioColecciones(rubro: "ceramica" | "ilustracion" = "ceramica"): Promise<PortfolioColeccion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("portfolio_colecciones")
    .select("*")
    .eq("rubro", rubro)
    .eq("activa", true)
    .order("orden", { ascending: true });

  if (error) {
    console.error("getPortfolioColecciones error:", error);
    return [];
  }
  return (data ?? []) as PortfolioColeccion[];
}

export async function getPortfolioColeccionesAdmin(rubro?: "ceramica" | "ilustracion"): Promise<PortfolioColeccion[]> {
  const adminClient = createAdminClient();
  let query = adminClient
    .from("portfolio_colecciones")
    .select("*")
    .order("orden", { ascending: true });

  if (rubro) {
    query = query.eq("rubro", rubro);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getPortfolioColeccionesAdmin error:", error);
    return [];
  }
  return (data ?? []) as PortfolioColeccion[];
}

// ─── Obras & Proyectos Especiales (Murales, Esculturas Mascotas, Packaging, B2B) ───

export async function getObrasProyectos(options?: {
  categoria?: CategoriaObra;
  soloDestacados?: boolean;
}): Promise<ObraProyecto[]> {
  const supabase = await createClient();
  let query = supabase
    .from("obras_proyectos")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true });

  if (options?.categoria) {
    query = query.eq("categoria", options.categoria);
  }
  if (options?.soloDestacados) {
    query = query.eq("destacado_home", true);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getObrasProyectos error:", error);
    return [];
  }
  return (data ?? []) as ObraProyecto[];
}

export async function getObrasProyectosAdmin(): Promise<ObraProyecto[]> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from("obras_proyectos")
    .select("*")
    .order("orden", { ascending: true });

  if (error) {
    console.error("getObrasProyectosAdmin error:", error);
    return [];
  }
  return (data ?? []) as ObraProyecto[];
}




