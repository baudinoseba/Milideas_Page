"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { checkoutSchema } from "@/lib/validations/schemas";
import type { CrearPedidoItem, TipoCatalogo } from "@/types";

export type CheckoutResult =
  | { success: true; pedidoId: string }
  | { success: false; error: string; isStockCollision?: boolean };

export async function crearPedidoAction(
  formData: FormData,
  items: CrearPedidoItem[],
  pricing: {
    subtotal: number;
    descuentoAplicado: number;
    costoEnvio: number;
    total: number;
  },
): Promise<CheckoutResult> {
  const raw = {
    nombreContacto: formData.get("nombreContacto"),
    whatsappContacto: formData.get("whatsappContacto"),
    emailContacto: formData.get("emailContacto") ?? "",
    zonaLogisticaId: formData.get("zonaLogisticaId"),
    tipoEnvio: formData.get("tipoEnvio"),
    metodoPago: formData.get("metodoPago"),
    direccionEnvio:
      formData.get("tipoEnvio") === "domicilio"
        ? {
            calle: formData.get("calle"),
            numero: formData.get("numero"),
            ciudad: formData.get("ciudad"),
            codigoPostal: formData.get("codigoPostal"),
            referencia: formData.get("referencia") || undefined,
          }
        : undefined,
  };

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message ?? "Datos inválidos" };
  }

  if (items.length === 0) {
    return { success: false, error: "El carrito está vacío" };
  }

  const supabase = await createClient();

  const direccionPayload =
    parsed.data.tipoEnvio === "taller"
      ? { taller: true, tipo: "taller", retiro: "Florentino Ameghino 1576, Sunchales, Santa Fe" }
      : (parsed.data.direccionEnvio ?? null);

  let { data, error } = await supabase.rpc("crear_pedido", {
    p_items: items,
    p_nombre_contacto: parsed.data.nombreContacto,
    p_whatsapp_contacto: parsed.data.whatsappContacto,
    p_email_contacto: parsed.data.emailContacto || "",
    p_tipo_envio: parsed.data.tipoEnvio as any,
    p_zona_logistica_id: parsed.data.zonaLogisticaId || null,
    p_direccion_envio: direccionPayload,
    p_metodo_pago: parsed.data.metodoPago,
    p_subtotal: pricing.subtotal,
    p_descuento_aplicado: pricing.descuentoAplicado,
    p_costo_envio: pricing.costoEnvio,
    p_total: pricing.total,
  });

  // Fallback if remote Postgres enum 'tipo_envio' does not have 'taller' added yet
  if (error && error.message.includes('enum tipo_envio: "taller"')) {
    const fallbackRes = await supabase.rpc("crear_pedido", {
      p_items: items,
      p_nombre_contacto: parsed.data.nombreContacto,
      p_whatsapp_contacto: parsed.data.whatsappContacto,
      p_email_contacto: parsed.data.emailContacto || "",
      p_tipo_envio: "agencia" as any,
      p_zona_logistica_id: parsed.data.zonaLogisticaId || null,
      p_direccion_envio: { taller: true, tipo: "taller", retiro: "Florentino Ameghino 1576, Sunchales, Santa Fe" },
      p_metodo_pago: parsed.data.metodoPago,
      p_subtotal: pricing.subtotal,
      p_descuento_aplicado: pricing.descuentoAplicado,
      p_costo_envio: 0,
      p_total: pricing.total,
    });
    data = fallbackRes.data;
    error = fallbackRes.error;
  }

  if (error) {
    if (error.message.includes("STOCK_INSUFICIENTE")) {
      const parts = error.message.split("STOCK_INSUFICIENTE:");
      const productName = parts[1] ? parts[1].trim() : "una de las piezas de tu carrito";
      return {
        success: false,
        isStockCollision: true,
        error: `La pieza "${productName}" acaba de ser reservada por otro comprador. Te llevamos a tu carrito para que puedas actualizar tu compra.`,
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/catalogo");
  return { success: true, pedidoId: data };
}

export async function subirComprobanteAction(
  pedidoId: string,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const file = formData.get("comprobante") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "Seleccioná un archivo" };
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${pedidoId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("comprobantes")
    .upload(path, file);

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data: urlData } = supabase.storage.from("comprobantes").getPublicUrl(path);

  const { error: rpcError } = await supabase.rpc("actualizar_comprobante", {
    p_pedido_id: pedidoId,
    p_comprobante_url: urlData.publicUrl,
  });

  if (rpcError) {
    return { success: false, error: rpcError.message };
  }

  revalidatePath(`/checkout/exito/${pedidoId}`);
  return { success: true };
}

export async function loginAction(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email")),
    password: String(formData.get("password")),
  });
  if (error) return { error: error.message };
  return { success: true };
}

export async function registroAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));
    const nombreCompleto = String(formData.get("nombreCompleto"));
    const whatsapp = String(formData.get("whatsapp"));

    console.log("registroAction: starting signUp for", email);

    // 1. Create the auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre_completo: nombreCompleto,
          whatsapp: whatsapp,
        },
      },
    });

    if (error) {
      console.error("registroAction: signUp error:", error);
      return { error: error.message };
    }

    console.log("registroAction: signUp success, user ID:", data.user?.id);

    // 2. Sign in to establish session cookies
    if (data.user) {
      if (!data.session) {
        console.log("registroAction: signing in to establish session");
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          console.error("registroAction: signIn error:", signInError);
        } else {
          console.log("registroAction: session established");
        }
      }

      // 3. Create profile using service role client (bypasses RLS entirely)
      const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
      if (serviceRoleKey) {
        const adminClient = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey,
          { auth: { persistSession: false, autoRefreshToken: false } }
        );

        console.log("registroAction: creating profile with service role client...");
        const { error: insertError } = await adminClient.from("perfiles").upsert({
          id: data.user.id,
          nombre_completo: nombreCompleto,
          whatsapp: whatsapp,
          es_admin: false,
        });

        if (insertError) {
          console.error("registroAction: profile creation error:", insertError);
        } else {
          console.log("registroAction: profile created successfully");
        }
      } else {
        console.warn("registroAction: SUPABASE_SERVICE_ROLE_KEY not set, relying on trigger for profile creation");
      }
    }

    return { success: true };
  } catch (err) {
    console.error("registroAction unhandled exception:", err);
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updatePerfilAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const nombreCompleto = formData.get("nombreCompleto");
  const whatsapp = formData.get("whatsapp");
  const nombreUsuario = formData.get("nombreUsuario");
  const dni = formData.get("dni");
  const direccionCalle = formData.get("direccionCalle");
  const direccionNumero = formData.get("direccionNumero");
  const direccionPiso = formData.get("direccionPiso");
  const direccionDepto = formData.get("direccionDepto");
  const direccionCiudad = formData.get("direccionCiudad");
  const direccionProvincia = formData.get("direccionProvincia");
  const direccionCodigoPostal = formData.get("direccionCodigoPostal");
  const direccionReferencia = formData.get("direccionReferencia");

  const { error } = await supabase
    .from("perfiles")
    .upsert({
      id: user.id,
      nombre_completo: nombreCompleto ? String(nombreCompleto) : null,
      whatsapp: whatsapp ? String(whatsapp) : null,
      nombre_usuario: nombreUsuario ? String(nombreUsuario) : null,
      dni: dni ? String(dni) : null,
      direccion_calle: direccionCalle ? String(direccionCalle) : null,
      direccion_numero: direccionNumero ? String(direccionNumero) : null,
      direccion_piso: direccionPiso ? String(direccionPiso) : null,
      direccion_depto: direccionDepto ? String(direccionDepto) : null,
      direccion_ciudad: direccionCiudad ? String(direccionCiudad) : null,
      direccion_provincia: direccionProvincia ? String(direccionProvincia) : null,
      direccion_codigo_postal: direccionCodigoPostal ? String(direccionCodigoPostal) : null,
      direccion_referencia: direccionReferencia ? String(direccionReferencia) : null,
    });

  if (error) return { error: error.message };
  revalidatePath("/cuenta/perfil");
  return { success: true };
}

export async function updateEmailAction(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email });
  if (error) return { error: error.message };
  return { success: true };
}

export async function updatePasswordAction(password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { success: true };
}

export async function makeMeAdminAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("nombre_completo, whatsapp")
    .eq("id", user.id)
    .single();

  const { error } = await supabase
    .from("perfiles")
    .upsert({
      id: user.id,
      nombre_completo: perfil?.nombre_completo || user.user_metadata?.nombre_completo || user.email || "Usuario",
      whatsapp: perfil?.whatsapp || user.user_metadata?.whatsapp || "",
      es_admin: true,
    });

  if (error) return { error: error.message };
  revalidatePath("/cuenta/perfil");
  return { success: true };
}

export async function confirmarPagoAction(pedidoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("confirmar_pago", { p_pedido_id: pedidoId });
  if (error) return { error: error.message };
  revalidatePath("/admin/pedidos");
  return { success: true };
}

export async function cancelarPedidoAction(pedidoId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancelar_pedido", { p_pedido_id: pedidoId });
  if (error) return { error: error.message };
  revalidatePath("/admin/pedidos");
  revalidatePath("/catalogo");
  return { success: true };
}

export async function saveProductoAction(
  formData: FormData,
  productoId?: string,
) {
  const supabase = await createClient();
  const nombre = String(formData.get("nombre"));
  const inputSlug = String(formData.get("slug") || "").trim();
  const slug = inputSlug || (await generateUniqueSlug(supabase, nombre, productoId));

  const altoCm = formData.get("altoCm") ? Number(formData.get("altoCm")) : null;
  const anchoCm = formData.get("anchoCm") ? Number(formData.get("anchoCm")) : null;
  const dimensiones = String(formData.get("dimensiones") || "").trim() || null;
  const tipoCatalogo = String(formData.get("tipoCatalogo") || "ceramica").trim();

  // Discipline specific fields
  const capacidadMl = formData.get("capacidadMl") ? Number(formData.get("capacidadMl")) : null;
  const papelSoporte = String(formData.get("papelSoporte") || "").trim() || null;
  const materialTecnica = String(formData.get("materialTecnica") || "").trim() || null;
  const edicionNumerada = String(formData.get("edicionNumerada") || "").trim() || null;
  const marcoIncluido = formData.get("marcoIncluido") === "on";
  const pedestalIncluido = formData.get("pedestalIncluido") === "on";
  const aptoLavavajillas = formData.get("aptoLavavajillas") === "on";
  const aptoMicroondas = formData.get("aptoMicroondas") === "on";

  const atributosEspecificos = {
    capacidad_ml: capacidadMl,
    papel_soporte: papelSoporte,
    material_tecnica: materialTecnica,
    edicion_numerada: edicionNumerada,
    marco_incluido: marcoIncluido,
    pedestal_incluido: pedestalIncluido,
    apto_lavavajillas: aptoLavavajillas,
    apto_microondas: aptoMicroondas,
  };

  const payload = {
    nombre,
    slug,
    tipo_catalogo: tipoCatalogo as any,
    descripcion: String(formData.get("descripcion") || "") || null,
    categoria_id: (formData.get("categoriaId") as string) || null,
    precio_base: Number(formData.get("precioBase")),
    es_personalizable: formData.get("esPersonalizable") === "on",
    stock_disponible: Number(formData.get("stockDisponible")),
    es_entrega_inmediata: formData.get("esEntregaInmediata") === "on",
    fecha_lanzamiento: (formData.get("fechaLanzamiento") as string) || null,
    activo: formData.get("activo") === "on",
    alto_cm: altoCm,
    ancho_cm: anchoCm,
    dimensiones,
    capacidad_ml: capacidadMl,
    papel_soporte: papelSoporte,
    material_tecnica: materialTecnica,
    edicion_numerada: edicionNumerada,
    marco_incluido: marcoIncluido,
    pedestal_incluido: pedestalIncluido,
    apto_lavavajillas: aptoLavavajillas,
    apto_microondas: aptoMicroondas,
    atributos_especificos: atributosEspecificos,
  };


  if (productoId) {
    const { error } = await supabase.from("productos").update(payload).eq("id", productoId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("productos").insert(payload);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/productos");
  revalidatePath("/catalogo");
  return { success: true };
}

export async function saveCategoriaAction(formData: FormData, id?: string) {
  const supabase = await createClient();
  const nombre = String(formData.get("nombre"));
  const tipoCatalogo = (formData.get("tipoCatalogo") as any) || "ceramica";
  if (id) {
    const { error } = await supabase.from("categorias").update({ nombre, tipo_catalogo: tipoCatalogo }).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("categorias").insert({ nombre, tipo_catalogo: tipoCatalogo });
    if (error) return { error: error.message };
  }
  revalidatePath("/admin/categorias");
  revalidatePath("/catalogo");
  return { success: true };
}

export async function saveZonaAction(formData: FormData, id?: string) {
  const supabase = await createClient();
  const payload = {
    zona_nombre: String(formData.get("zonaNombre")),
    precio_agencia: Number(formData.get("precioAgencia")),
    precio_domicilio: Number(formData.get("precioDomicilio")),
    activa: formData.get("activa") === "on",
  };
  if (id) {
    const { error } = await supabase.from("configuracion_logistica").update(payload).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("configuracion_logistica").insert(payload);
    if (error) return { error: error.message };
  }
  revalidatePath("/admin/logistica");
  return { success: true };
}

export async function uploadProductoImageAction(
  productoId: string,
  formData: FormData,
): Promise<{ success: boolean; error?: string; url?: string }> {
  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "Seleccioná una imagen" };
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${productoId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("productos")
    .upload(path, file);

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data: urlData } = supabase.storage.from("productos").getPublicUrl(path);

  // Get current max order
  const { data: existing } = await supabase
    .from("producto_imagenes")
    .select("orden")
    .eq("producto_id", productoId)
    .order("orden", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 && existing[0] ? existing[0].orden + 1 : 0;

  const { error: insertError } = await supabase.from("producto_imagenes").insert({
    producto_id: productoId,
    url_imagen: urlData.publicUrl,
    orden: nextOrder,
  });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  revalidatePath(`/admin/productos/${productoId}`);
  revalidatePath("/admin/productos");
  revalidatePath("/catalogo");
  return { success: true, url: urlData.publicUrl };
}

export async function deleteProductoImageAction(
  imageId: string,
  productoId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get the image record to find the storage path
  const { data: imageRecord } = await supabase
    .from("producto_imagenes")
    .select("url_imagen")
    .eq("id", imageId)
    .single();

  if (imageRecord) {
    // Extract storage path from URL
    const url = imageRecord.url_imagen;
    const match = url.match(/productos\/(.+)$/);
    if (match) {
      await supabase.storage.from("productos").remove([match[1]]);
    }
  }

  const { error } = await supabase
    .from("producto_imagenes")
    .delete()
    .eq("id", imageId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/admin/productos/${productoId}`);
  revalidatePath("/admin/productos");
  revalidatePath("/catalogo");
  return { success: true };
}

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function deleteProductoAction(
  productoId: string,
): Promise<{ success: boolean; error?: string }> {
  const adminClient = createAdminClient();

  // Delete all images from storage first
  const { data: images } = await adminClient
    .from("producto_imagenes")
    .select("url_imagen")
    .eq("producto_id", productoId);

  if (images && images.length > 0) {
    const paths = images
      .map((img) => {
        const match = img.url_imagen.match(/productos\/(.+)$/);
        return match ? match[1] : null;
      })
      .filter(Boolean) as string[];

    if (paths.length > 0) {
      await adminClient.storage.from("productos").remove(paths);
    }
  }

  // Unlink product from order history items using admin client (bypasses RLS restriction)
  await adminClient.from("items_pedido").update({ producto_id: null }).eq("producto_id", productoId);

  const { error } = await adminClient.from("productos").delete().eq("id", productoId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/productos");
  revalidatePath("/admin/produccion");
  revalidatePath("/catalogo");
  revalidatePath("/");
  return { success: true };
}


export async function toggleProductoActivoAction(
  productoId: string,
  activo: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("productos")
    .update({ activo })
    .eq("id", productoId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/productos");
  revalidatePath("/catalogo");
  return { success: true };
}

export async function marcarEnviadoAction(pedidoId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pedidos")
    .update({ estado: "enviado" })
    .eq("id", pedidoId)
    .eq("estado", "confirmado");

  if (error) return { error: error.message };
  revalidatePath("/admin/pedidos");
  return { success: true };
}

export async function deleteCategoriaAction(
  categoriaId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("categorias")
    .delete()
    .eq("id", categoriaId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/categorias");
  return { success: true };
}

export async function deleteZonaAction(
  zonaId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracion_logistica")
    .delete()
    .eq("id", zonaId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/logistica");
  return { success: true };
}

export async function toggleZonaActivaAction(
  zonaId: string,
  activa: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("configuracion_logistica")
    .update({ activa })
    .eq("id", zonaId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/logistica");
  return { success: true };
}

// ─── Production Workflow Actions ───

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function generateUniqueSlug(
  supabase: any,
  nombre: string,
  currentProductoId?: string,
): Promise<string> {
  const baseSlug = slugify(nombre) || "pieza";
  let query = supabase.from("productos").select("id").eq("slug", baseSlug);
  if (currentProductoId) {
    query = query.neq("id", currentProductoId);
  }
  const { data } = await query;
  if (!data || data.length === 0) {
    return baseSlug;
  }
  return `${baseSlug}-${Date.now().toString(36).slice(-4)}`;
}

export async function createProduccionAction(
  nombre: string,
  tipoCatalogo: TipoCatalogo = "ceramica",
  descripcion?: string,
): Promise<{ success: boolean; error?: string; id?: string; nombre?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("producciones")
    .insert({
      nombre,
      tipo_catalogo: tipoCatalogo as any,
      descripcion: descripcion || null,
      activa: false,
    })
    .select("id, nombre")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/produccion");
  return { success: true, id: data.id, nombre: data.nombre };
}

export async function createCategoriaInlineAction(
  nombre: string,
): Promise<{ success: boolean; error?: string; id?: string; nombre?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorias")
    .insert({ nombre })
    .select("id, nombre")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/productos");
  return { success: true, id: data.id, nombre: data.nombre };
}

export async function savePiezaProduccionAction(
  formData: FormData,
  produccionId: string,
  productoId?: string,
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supabase = await createClient();
  const nombre = String(formData.get("nombre"));
  const selectedCategoria = (formData.get("categoriaId") as string) || null;
  const uniqueSlug = await generateUniqueSlug(supabase, nombre, productoId);

  const altoCm = formData.get("altoCm") ? Number(formData.get("altoCm")) : null;
  const anchoCm = formData.get("anchoCm") ? Number(formData.get("anchoCm")) : null;
  const dimensiones = String(formData.get("dimensiones") || "").trim() || null;

  const tipoCatalogo = (formData.get("tipoCatalogo") as TipoCatalogo) || "ceramica";
  const materialTecnica = String(formData.get("materialTecnica") || "").trim() || null;
  const papelSoporte = String(formData.get("papelSoporte") || "").trim() || null;
  const tamanoLamina = String(formData.get("tamanoLamina") || "").trim() || null;
  const capacidadMl = formData.get("capacidadMl") ? Number(formData.get("capacidadMl")) : null;
  const edicionNumerada = String(formData.get("edicionNumerada") || "").trim() || null;
  const marcoIncluido = formData.get("marcoIncluido") === "on";
  const pedestalIncluido = formData.get("pedestalIncluido") === "on";
  const aptoLavavajillas = formData.get("aptoLavavajillas") === "on";
  const aptoMicroondas = formData.get("aptoMicroondas") === "on";

  const payload = {
    nombre,
    slug: uniqueSlug,
    tipo_catalogo: tipoCatalogo as any,
    descripcion: String(formData.get("descripcion") || "") || null,
    categoria_id: selectedCategoria,
    produccion_id: produccionId,
    precio_base: Number(formData.get("precioBase")) || 0,
    es_personalizable: formData.get("esPersonalizable") === "on",
    stock_disponible: Number(formData.get("stockDisponible")) || 1,
    es_entrega_inmediata: false,
    activo: false, // Always draft in production mode until collection publication
    alto_cm: altoCm,
    ancho_cm: anchoCm,
    dimensiones,
    material_tecnica: materialTecnica,
    papel_soporte: papelSoporte,
    tamano_lamina: tamanoLamina,
    capacidad_ml: capacidadMl,
    edicion_numerada: edicionNumerada,
    marco_incluido: marcoIncluido,
    pedestal_incluido: pedestalIncluido,
    apto_lavavajillas: aptoLavavajillas,
    apto_microondas: aptoMicroondas,
  };


  if (productoId) {
    const { error } = await supabase
      .from("productos")
      .update(payload)
      .eq("id", productoId);
    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/produccion");
    return { success: true, id: productoId };
  } else {
    const { data, error } = await supabase
      .from("productos")
      .insert(payload)
      .select("id")
      .single();
    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/produccion");
    return { success: true, id: data.id };
  }
}

export async function vincularProductoAProduccionAction(
  productoId: string,
  produccionId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("productos")
    .update({ produccion_id: produccionId })
    .eq("id", productoId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/produccion");
  revalidatePath("/admin/productos");
  return { success: true };
}


export async function publicarProduccionAction(
  produccionId: string,
): Promise<{ success: boolean; error?: string; count?: number }> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // Update produccion record
  await supabase
    .from("producciones")
    .update({ activa: true, fecha_lanzamiento: now })
    .eq("id", produccionId);

  // Update all products in this production
  const { data, error } = await supabase
    .from("productos")
    .update({ 
      activo: true,
      fecha_lanzamiento: now
    })
    .eq("produccion_id", produccionId)
    .select("id");

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/productos");
  revalidatePath("/admin/produccion");
  revalidatePath("/catalogo");
  revalidatePath("/colecciones");
  revalidatePath("/");
  return { success: true, count: data?.length ?? 0 };
}

export async function deletePiezaProduccionAction(
  productoId: string,
): Promise<{ success: boolean; error?: string }> {
  const adminClient = createAdminClient();

  // Delete images from storage
  const { data: images } = await adminClient
    .from("producto_imagenes")
    .select("url_imagen")
    .eq("producto_id", productoId);

  if (images && images.length > 0) {
    const paths = images
      .map((img) => {
        const match = img.url_imagen.match(/productos\/(.+)$/);
        return match ? match[1] : null;
      })
      .filter(Boolean) as string[];

    if (paths.length > 0) {
      await adminClient.storage.from("productos").remove(paths);
    }
  }

  // Unlink product from order history items using admin client (bypasses RLS restriction)
  await adminClient.from("items_pedido").update({ producto_id: null }).eq("producto_id", productoId);

  const { error } = await adminClient.from("productos").delete().eq("id", productoId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/produccion");
  revalidatePath("/admin/productos");
  revalidatePath("/catalogo");
  revalidatePath("/");
  return { success: true };
}


export async function reorderProductoImagesAction(
  productoId: string,
  imageIdsInOrder: string[],
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Update order for each image ID
  for (let i = 0; i < imageIdsInOrder.length; i++) {
    const id = imageIdsInOrder[i];
    if (!id) continue;
    const { error } = await supabase
      .from("producto_imagenes")
      .update({ orden: i })
      .eq("id", id)
      .eq("producto_id", productoId);

    if (error) return { success: false, error: error.message };
  }

  revalidatePath(`/admin/productos/${productoId}`);
  revalidatePath("/admin/produccion");
  revalidatePath("/admin/productos");
  revalidatePath("/catalogo");
  revalidatePath("/");
  return { success: true };
}

export async function deleteProduccionCompletaAction(
  categoriaId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get all products in category
  const { data: productos } = await supabase
    .from("productos")
    .select("id")
    .eq("categoria_id", categoriaId);

  if (productos && productos.length > 0) {
    for (const p of productos) {
      await deletePiezaProduccionAction(p.id);
    }
  }

  // Delete category
  const { error } = await supabase.from("categorias").delete().eq("id", categoriaId);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/produccion");
  revalidatePath("/admin/categorias");
  revalidatePath("/catalogo");
  revalidatePath("/");
  return { success: true };
}

export async function saveConfiguracionSitioAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const heroTitulo = String(formData.get("heroTitulo") || "").trim();
  const heroSubtitulo = String(formData.get("heroSubtitulo") || "").trim();
  const coleccionDestacadaId = (formData.get("coleccionDestacadaId") as string) || null;

  const bancoTitular = String(formData.get("bancoTitular") || "Milagros Anita Ferrero").trim();
  const bancoCuit = String(formData.get("bancoCuit") || "27-43717260-4").trim();
  const bancoNombre = String(formData.get("bancoNombre") || "Brubank").trim();
  const bancoAlias = String(formData.get("bancoAlias") || "milideasarte").trim();
  const bancoCbu = String(formData.get("bancoCbu") || "").trim();

  const tallerDireccion = String(formData.get("tallerDireccion") || "Florentino Ameghino 1576").trim();
  const tallerCiudad = String(formData.get("tallerCiudad") || "Sunchales").trim();
  const tallerProvincia = String(formData.get("tallerProvincia") || "Santa Fe").trim();
  const tallerCodigoPostal = String(formData.get("tallerCodigoPostal") || "2322").trim();
  const vendedorWhatsapp = String(formData.get("vendedorWhatsapp") || "5493493668308").trim();

  const payload = {
    hero_titulo: heroTitulo || "Piezas únicas, hechas a mano.",
    hero_subtitulo: heroSubtitulo || "Cerámica de autor en ediciones limitadas.",
    coleccion_destacada_id: coleccionDestacadaId || null,
    banco_titular: bancoTitular,
    banco_cuit: bancoCuit,
    banco_nombre: bancoNombre,
    banco_alias: bancoAlias,
    banco_cbu: bancoCbu,
    taller_direccion: tallerDireccion,
    taller_ciudad: tallerCiudad,
    taller_provincia: tallerProvincia,
    taller_codigo_postal: tallerCodigoPostal,
    vendedor_whatsapp: vendedorWhatsapp,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data: existing } = await supabase.from("configuracion_sitio").select("id").limit(1).single();

    if (existing) {
      await supabase.from("configuracion_sitio").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("configuracion_sitio").insert(payload);
    }
  } catch (err) {
    console.warn("Notice: configuracion_sitio DB table warning:", err);
  }

  revalidatePath("/");
  revalidatePath("/admin/personalizacion");
  return { success: true };
}

export async function uploadLogoAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string; url?: string }> {
  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "Seleccioná un archivo de logo" };
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `logo_${Date.now()}.${ext}`;

  // Use 'productos' bucket as primary storage bucket
  let { error: uploadError } = await supabase.storage.from("productos").upload(path, file);
  if (uploadError) {
    const { error: fallbackErr } = await supabase.storage.from("sitio").upload(path, file);
    if (fallbackErr && uploadError) {
      return { success: false, error: uploadError.message };
    }
  }

  const { data: urlData } = supabase.storage.from("productos").getPublicUrl(path);

  try {
    const { data: existing } = await supabase.from("configuracion_sitio").select("id").limit(1).single();

    if (existing) {
      await supabase.from("configuracion_sitio").update({ logo_url: urlData.publicUrl }).eq("id", existing.id);
    } else {
      await supabase.from("configuracion_sitio").insert({ logo_url: urlData.publicUrl });
    }
  } catch (err) {
    console.warn("DB config update notice:", err);
  }

  revalidatePath("/");
  revalidatePath("/admin/personalizacion");
  return { success: true, url: urlData.publicUrl };
}

export async function uploadHeroImageAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string; url?: string }> {
  const file = formData.get("heroImage") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "Seleccioná una imagen de portada" };
  }

  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `hero_${Date.now()}.${ext}`;

  // Use 'productos' bucket as primary storage bucket
  let { error: uploadError } = await supabase.storage.from("productos").upload(path, file);
  if (uploadError) {
    const { error: fallbackErr } = await supabase.storage.from("sitio").upload(path, file);
    if (fallbackErr && uploadError) {
      return { success: false, error: uploadError.message };
    }
  }

  const { data: urlData } = supabase.storage.from("productos").getPublicUrl(path);

  try {
    const { data: existing } = await supabase.from("configuracion_sitio").select("id").limit(1).single();

    if (existing) {
      await supabase.from("configuracion_sitio").update({ hero_imagen_url: urlData.publicUrl }).eq("id", existing.id);
    } else {
      await supabase.from("configuracion_sitio").insert({ hero_imagen_url: urlData.publicUrl });
    }
  } catch (err) {
    console.warn("DB config update notice:", err);
  }

  revalidatePath("/");
  revalidatePath("/admin/personalizacion");
  return { success: true, url: urlData.publicUrl };
}

export async function bulkAdjustZonasAction(
  porcentaje: number,
): Promise<{ success: boolean; error?: string; count?: number }> {
  if (isNaN(porcentaje) || porcentaje === 0) {
    return { success: false, error: "Ingresá un porcentaje válido de ajuste" };
  }

  const supabase = await createClient();
  const { data: zonas, error: fetchErr } = await supabase.from("configuracion_logistica").select("*");
  if (fetchErr || !zonas) {
    return { success: false, error: fetchErr?.message ?? "Error al obtener zonas de envío" };
  }

  const multiplier = 1 + porcentaje / 100;
  let count = 0;

  for (const z of zonas) {
    const nuevoPrecioAgencia = Math.round((z.precio_agencia * multiplier) / 50) * 50;
    const nuevoPrecioDomicilio = Math.round((z.precio_domicilio * multiplier) / 50) * 50;

    await supabase
      .from("configuracion_logistica")
      .update({
        precio_agencia: Math.max(0, nuevoPrecioAgencia),
        precio_domicilio: Math.max(0, nuevoPrecioDomicilio),
      })
      .eq("id", z.id);
    count++;
  }

  revalidatePath("/admin/logistica");
  revalidatePath("/checkout");
  return { success: true, count };
}

export async function expirarPedidosVencidosAction(): Promise<{
  success: boolean;
  error?: string;
  count?: number;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("expirar_pedidos_vencidos");

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/pedidos");
  revalidatePath("/catalogo");
  return { success: true, count: data ?? 0 };
}

export async function crearEncargoAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  encargoId?: string;
}> {
  const supabase = await createClient();

  const productoId = (formData.get("productoId") as string) || null;
  const nombreContacto = String(formData.get("nombreContacto") || "").trim();
  const whatsappContacto = String(formData.get("whatsappContacto") || "").trim();
  const emailContacto = String(formData.get("emailContacto") || "").trim() || null;
  const tipoCatalogo = (formData.get("tipoCatalogo") as any) || "ceramica";
  const esPersonalizado = formData.get("esPersonalizado") === "true";
  const detallePersonalizacion = String(formData.get("detallePersonalizacion") || "").trim() || null;
  const medidaSeleccionada = String(formData.get("medidaSeleccionada") || "").trim() || null;
  const conMarco = formData.get("conMarco") === "true";
  const metodoEntrega = String(formData.get("metodoEntrega") || "taller").trim();

  const precioEstimado = Number(formData.get("precioEstimado")) || 0;
  const recargoPersonalizado = Number(formData.get("recargoPersonalizado")) || 0;
  const adicionalMedida = Number(formData.get("adicionalMedida")) || 0;
  const adicionalMarco = Number(formData.get("adicionalMarco")) || 0;
  const totalEstimado = Number(formData.get("totalEstimado")) || 0;

  let direccionEnvio = null;
  if (metodoEntrega === "domicilio") {
    direccionEnvio = {
      calle: String(formData.get("calle") || ""),
      numero: String(formData.get("numero") || ""),
      ciudad: String(formData.get("ciudad") || ""),
      codigoPostal: String(formData.get("codigoPostal") || ""),
      referencia: String(formData.get("referencia") || ""),
    };
  } else if (metodoEntrega === "agencia") {
    direccionEnvio = {
      ciudad: String(formData.get("ciudad") || ""),
    };
  }

  const itemsJsonRaw = formData.get("itemsJson") as string;
  let itemsArray: any[] = [];
  if (itemsJsonRaw) {
    try {
      itemsArray = JSON.parse(itemsJsonRaw);
    } catch (e) {}
  }

  const firstItem = itemsArray[0];

  const { data, error } = await supabase
    .from("encargos")
    .insert({
      producto_id: firstItem?.productoId ?? productoId,
      nombre_contacto: nombreContacto,
      whatsapp_contacto: whatsappContacto,
      email_contacto: emailContacto,
      tipo_catalogo: firstItem?.tipoCatalogo ?? tipoCatalogo,
      es_personalizado: itemsArray.some((i) => i.esPersonalizado) || esPersonalizado,
      detalle_personalizacion:
        itemsArray.map((i) => i.detallePersonalizacion).filter(Boolean).join(" | ") || detallePersonalizacion,
      medida_seleccionada: firstItem?.medidaSeleccionada ?? medidaSeleccionada,
      con_marco: itemsArray.some((i) => i.conMarco) || conMarco,
      metodo_entrega: metodoEntrega,
      direccion_envio: direccionEnvio,
      precio_estimado: precioEstimado,
      recargo_personalizado: recargoPersonalizado,
      adicional_medida: adicionalMedida,
      adicional_marco: adicionalMarco,
      total_estimado: totalEstimado,
      estado: "pendiente",
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (itemsArray.length > 0) {
    const itemsPayload = itemsArray.map((it) => ({
      encargo_id: data.id,
      producto_id: it.productoId || null,
      nombre_producto: it.nombre,
      tipo_catalogo: it.tipoCatalogo || "ceramica",
      es_personalizado: it.esPersonalizado || false,
      detalle_personalizacion: it.detallePersonalizacion || null,
      medida_seleccionada: it.medidaSeleccionada || null,
      con_marco: it.conMarco || false,
      precio_unitario_base: it.precioBase || 0,
      recargo_personalizado: it.recargoPersonalizado || 0,
      adicional_medida: it.adicionalMedida || 0,
      adicional_marco: it.adicionalMarco || 0,
      precio_unitario_final: it.precioUnitarioFinal || 0,
      cantidad: it.cantidad || 1,
      subtotal: (it.precioUnitarioFinal || 0) * (it.cantidad || 1),
    }));

    await supabase.from("items_encargo").insert(itemsPayload);
  }

  revalidatePath("/admin/encargos");
  return { success: true, encargoId: data.id };
}

export async function actualizarEstadoEncargoAction(
  id: string,
  nuevoEstado: string,
  demoraDias?: number,
  notas?: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const payload: any = {
    estado: nuevoEstado,
    updated_at: new Date().toISOString(),
  };

  if (demoraDias != null) payload.demora_estimada_dias = demoraDias;
  if (notas != null) payload.notas_admin = notas;

  const { error } = await supabase
    .from("encargos")
    .update(payload)
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/encargos");
  return { success: true };
}

export async function saveConfiguracionEncargosAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  const supabase = await createClient();

  const medidasRaw = String(formData.get("medidasJson") || "[]");
  let medidasObj = [];
  try {
    medidasObj = JSON.parse(medidasRaw);
  } catch (e) {}

  const precioMarcoMadera = Number(formData.get("precioMarcoMadera")) || 8500;
  const porcentajeRecargo = Number(formData.get("porcentajeRecargoPersonalizado")) || 0.15;
  const demoraDefault = Number(formData.get("demoraDefaultDias")) || 15;

  const { error } = await supabase
    .from("configuracion_encargos")
    .upsert({
      id: "e2000000-0000-4000-8000-000000000001",
      medidas_ilustraciones: medidasObj,
      precio_marco_madera: precioMarcoMadera,
      porcentaje_recargo_personalizado: porcentajeRecargo,
      demora_default_dias: demoraDefault,
      updated_at: new Date().toISOString(),
    });

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/encargos/configuracion");
  revalidatePath("/catalogo");
  return { success: true };
}

