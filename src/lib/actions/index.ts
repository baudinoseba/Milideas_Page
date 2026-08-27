/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
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
  // NOTE: The pricing parameter from the client is intentionally IGNORED for security.
  // All monetary values are recalculated server-side from DB data.
  _clientPricing?: {
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
    zonaLogisticaId: formData.get("zonaLogisticaId") ?? "",
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

  // ── SECURITY: Recalculate pricing server-side ──────────────────────────────
  // Fetch authoritative prices from DB to prevent client-side price manipulation.
  const productoIds = [...new Set(items.map((i) => i.producto_id))];
  const { data: productosDB, error: prodErr } = await supabase
    .from("productos")
    .select("id, precio_base, es_personalizable, stock_disponible, activo")
    .in("id", productoIds);

  if (prodErr || !productosDB) {
    return { success: false, error: "Error al verificar los productos del carrito." };
  }

  // Build a map of DB prices for fast lookup
  const preciosDB = new Map(productosDB.map((p) => [p.id, p]));

  // Verify all products exist and are active, then compute subtotal
  let serverSubtotal = 0;
  for (const item of items) {
    const prod = preciosDB.get(item.producto_id);
    if (!prod || !prod.activo) {
      return { success: false, error: "Uno de los productos ya no está disponible." };
    }
    const PERSONALIZATION_SURCHARGE = 0.15;
    const precioUnitario = item.es_personalizado && prod.es_personalizable
      ? Math.round(prod.precio_base * (1 + PERSONALIZATION_SURCHARGE))
      : prod.precio_base;
    serverSubtotal += precioUnitario * item.cantidad;
  }

  // Fetch shipping cost from DB if a logistic zone is selected
  let serverCostoEnvio = 0;
  if (parsed.data.zonaLogisticaId && parsed.data.tipoEnvio !== "taller") {
    const { data: zona } = await supabase
      .from("configuracion_logistica")
      .select("precio_agencia, precio_domicilio")
      .eq("id", parsed.data.zonaLogisticaId)
      .eq("activa", true)
      .single();

    if (zona) {
      serverCostoEnvio = parsed.data.tipoEnvio === "domicilio"
        ? Number(zona.precio_domicilio)
        : Number(zona.precio_agencia);
    }
  }

  // Apply wholesale discount tiers (same logic as client-side calcularPricing)
  const totalPiezas = items.reduce((acc, i) => acc + i.cantidad, 0);
  const WHOLESALE_TIERS = [
    { minPieces: 35, discount: 0.2 },
    { minPieces: 20, discount: 0.15 },
    { minPieces: 15, discount: 0.1 },
  ];
  const tier = WHOLESALE_TIERS.find((t) => totalPiezas >= t.minPieces);
  const serverDescuento = tier ? Math.round(serverSubtotal * tier.discount) : 0;
  const serverTotal = serverSubtotal - serverDescuento + serverCostoEnvio;
  // ────────────────────────────────────────────────────────────────────────────

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
    p_subtotal: serverSubtotal,
    p_descuento_aplicado: serverDescuento,
    p_costo_envio: serverCostoEnvio,
    p_total: serverTotal,
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
      p_subtotal: serverSubtotal,
      p_descuento_aplicado: serverDescuento,
      p_costo_envio: 0,
      p_total: serverSubtotal - serverDescuento,
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

  // SECURITY: Verify the caller owns this order before allowing file upload.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch the order and check ownership
  const { data: pedido, error: pedidoErr } = await supabase
    .from("pedidos")
    .select("id, usuario_id")
    .eq("id", pedidoId)
    .single();

  if (pedidoErr || !pedido) {
    return { success: false, error: "Pedido no encontrado." };
  }

  // Allow: the authenticated owner, or anonymous orders (usuario_id IS NULL), or admins
  const isOwner = user && pedido.usuario_id === user.id;
  const isAnonymousOrder = pedido.usuario_id === null;
  if (!isOwner && !isAnonymousOrder) {
    return { success: false, error: "No tenés permiso para modificar este pedido." };
  }

  const file = formData.get("comprobante") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "Seleccioná un archivo" };
  }

  // SECURITY: Validate file type and size
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB for receipts
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Tipo de archivo no permitido. Usá JPG, PNG, WEBP, GIF o PDF." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { success: false, error: "El archivo supera el tamaño máximo (10MB)." };
  }

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


export async function loginAction(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  try {
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    let redirectTo = String(formData.get("redirect") || "");

    if (!email || !password) {
      return { error: "Por favor ingresá tu email y contraseña." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("loginAction error:", error);
      const msg = error.message || "";
      if (msg.includes("Invalid login credentials") || (error as any).status === 400) {
        return { error: "Email o contraseña incorrectos. Por favor verificá tus datos e intentalo nuevamente." };
      }
      if (msg.includes("Email not confirmed")) {
        return { error: "Tu correo electrónico aún no ha sido confirmado. Por favor revisá tu casilla de correo." };
      }
      if (msg.includes("rate limit") || (error as any).status === 429) {
        return { error: "Demasiados intentos fallidos. Por favor aguardá 1 minuto e intentalo de nuevo." };
      }
      return { error: error.message || "No se pudo iniciar sesión. Verificá tus datos." };
    }

    if (!data.session) {
      return { error: "No se pudo iniciar sesión. Verificá tu usuario y contraseña." };
    }

    // Determine target redirect path if not explicitly passed
    if (!redirectTo || redirectTo === "null" || redirectTo === "undefined") {
      const { data: perfil } = await supabase
        .from("perfiles")
        .select("es_admin")
        .eq("id", data.user.id)
        .single();

      if (perfil?.es_admin) {
        redirectTo = "/admin";
      } else {
        redirectTo = "/cuenta/perfil";
      }
    }

    // SECURITY (B1): Prevent open redirect — ensure redirectTo is a relative path on this domain.
    const safeRedirectTo =
      redirectTo.startsWith("/") && !redirectTo.startsWith("//")
        ? redirectTo
        : "/";

    revalidatePath("/", "layout");
    redirect(safeRedirectTo);
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT") || err?.message === "NEXT_REDIRECT") {
      throw err;
    }
    console.error("loginAction catch error:", err);
    return { error: err?.message || "Ocurrió un error inesperado al intentar iniciar sesión." };
  }
}

export async function recuperarPasswordAction(email: string, redirectTo: string) {
  try {
    const supabase = await createClient();
    // C6: Do not log user email addresses in production
    console.log("recuperarPasswordAction: sending password reset email");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });
    if (error) {
      console.error("recuperarPasswordAction Supabase error:", error);
      const status = (error as any).status;
      const msg = error.message || "";

      if (status === 429 || msg.includes("60 seconds") || msg.includes("rate limit")) {
        return { error: "⏳ Por seguridad, solo podés solicitar el correo de recuperación 1 vez cada 60 segundos. Por favor aguardá 1 minuto e intentalo nuevamente." };
      }
      if (msg.includes("Error sending recovery email") || msg.includes("SMTP") || msg.includes("535") || msg.includes("Authentication failed")) {
        return { error: "❌ Error en el servidor SMTP de Supabase al enviar el correo. Por favor verificá que la clave de aplicación de 16 letras de Gmail en el panel de Supabase siga activa." };
      }
      return { error: error.message || "Error al enviar el correo de recuperación. Verificá las credenciales SMTP en Supabase." };
    }
    console.log("recuperarPasswordAction: email sent successfully");
    return { success: true };
  } catch (err: any) {
    console.error("recuperarPasswordAction catch error:", err);
    return { error: err?.message || "Ocurrió un error inesperado al enviar el correo." };
  }
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

  const sanitizeString = (val: FormDataEntryValue | null, maxLength = 100) => {
    if (!val) return null;
    const str = String(val).trim();
    return str.length > 0 ? str.slice(0, maxLength) : null;
  };

  const nombreCompleto = sanitizeString(formData.get("nombreCompleto"), 100);
  const whatsapp = sanitizeString(formData.get("whatsapp"), 30);
  const nombreUsuario = sanitizeString(formData.get("nombreUsuario"), 50);
  const dni = sanitizeString(formData.get("dni"), 20);
  const direccionCalle = sanitizeString(formData.get("direccionCalle"), 100);
  const direccionNumero = sanitizeString(formData.get("direccionNumero"), 20);
  const direccionPiso = sanitizeString(formData.get("direccionPiso"), 10);
  const direccionDepto = sanitizeString(formData.get("direccionDepto"), 10);
  const direccionCiudad = sanitizeString(formData.get("direccionCiudad"), 100);
  const direccionProvincia = sanitizeString(formData.get("direccionProvincia"), 100);
  const direccionCodigoPostal = sanitizeString(formData.get("direccionCodigoPostal"), 20);
  const direccionReferencia = sanitizeString(formData.get("direccionReferencia"), 200);

  const { error } = await supabase
    .from("perfiles")
    .upsert({
      id: user.id,
      nombre_completo: nombreCompleto,
      whatsapp: whatsapp,
      nombre_usuario: nombreUsuario,
      dni: dni,
      direccion_calle: direccionCalle,
      direccion_numero: direccionNumero,
      direccion_piso: direccionPiso,
      direccion_depto: direccionDepto,
      direccion_ciudad: direccionCiudad,
      direccion_provincia: direccionProvincia,
      direccion_codigo_postal: direccionCodigoPostal,
      direccion_referencia: direccionReferencia,
    });

  if (error) return { error: error.message };
  revalidatePath("/cuenta/perfil");
  return { success: true };
}

export async function updateEmailAction(email: string) {
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!trimmed || !emailRegex.test(trimmed)) {
    return { error: "Formato de email inválido" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: trimmed });
  if (error) return { error: error.message };
  return { success: true };
}

export async function updatePasswordAction(password: string) {
  if (!password || password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { success: true };
}


export async function makeMeAdminAction(setupSecret?: string) {
  // SECURITY: This action is protected by a server-side secret.
  // The ADMIN_SETUP_SECRET env var must be set and must match the provided secret.
  // Without it, this action is completely disabled to prevent privilege escalation.
  const configuredSecret = process.env.ADMIN_SETUP_SECRET;
  if (!configuredSecret) {
    return { error: "Esta función está deshabilitada en este entorno." };
  }
  if (!setupSecret || setupSecret !== configuredSecret) {
    return { error: "Secreto de configuración inválido." };
  }

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

// ─── SECURITY HELPER (B3): Defense-in-depth admin auth check ────────────────
// This helper ensures server actions that mutate critical data explicitly verify
// admin status in the application layer, not relying solely on RLS.
async function requireAdmin(): Promise<{ supabase: Awaited<ReturnType<typeof createClient>>; userId: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  const { isUserAdmin } = await import("@/lib/supabase/queries");
  const admin = await isUserAdmin(user.id);
  if (!admin) return { error: "No autorizado" };
  return { supabase, userId: user.id };
}
// ────────────────────────────────────────────────────────────────────────────

export async function confirmarPagoAction(pedidoId: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;
  const { supabase } = auth;
  const { error } = await supabase.rpc("confirmar_pago", { p_pedido_id: pedidoId });
  if (error) return { error: error.message };
  revalidatePath("/admin/pedidos");
  return { success: true };
}

export async function cancelarPedidoAction(pedidoId: string) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth;
  const { supabase } = auth;
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

  const payload: Record<string, any> = {
    nombre,
    slug,
    descripcion: String(formData.get("descripcion") || "") || null,
    categoria_id: (formData.get("categoriaId") as string) || null,
    precio_base: Number(formData.get("precioBase")) || 0,
    es_personalizable: formData.get("esPersonalizable") === "on",
    stock_disponible: Number(formData.get("stockDisponible")) || 0,
    es_entrega_inmediata: formData.get("esEntregaInmediata") === "on",
    fecha_lanzamiento: (formData.get("fechaLanzamiento") as string) || null,
    activo: formData.get("activo") === "on",
  };

  if (tipoCatalogo) payload.tipo_catalogo = tipoCatalogo;
  const produccionId = (formData.get("produccionId") as string) || null;
  if (produccionId) payload.produccion_id = produccionId;


  let targetId = productoId;

  if (productoId) {
    const { error } = await supabase.from("productos").update(payload).eq("id", productoId);
    if (error) return { error: error.message };
  } else {
    const { data: newProd, error } = await supabase.from("productos").insert(payload).select("id").single();
    if (error) return { error: error.message };
    targetId = newProd.id;
  }

  // Upload any imageFiles passed in formData for new products
  const imageFiles = formData.getAll("imageFiles") as File[];
  if (imageFiles && imageFiles.length > 0 && targetId) {
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      if (file && file.size > 0) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${targetId}/${Date.now()}_${i}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("productos").upload(path, file);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("productos").getPublicUrl(path);
          await supabase.from("producto_imagenes").insert({
            producto_id: targetId,
            url_imagen: urlData.publicUrl,
            orden: i,
          });
        }
      }
    }
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
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "Seleccioná una imagen" };
  }

  // SECURITY (B5): Validate MIME type and file size
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Tipo de archivo no permitido. Usá JPG, PNG, WEBP o GIF." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { success: false, error: "La imagen supera el tamaño máximo permitido (10MB)." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
  const path = `${productoId}/${Date.now()}.${safeExt}`;

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

export async function uploadGenericImageAction(
  formData: FormData,
  folder: string = "catalogo",
): Promise<{ success: boolean; error?: string; url?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "Seleccioná un archivo de imagen válido." };
  }

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
  const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Tipo de archivo no permitido. Usá JPG, PNG, WEBP o GIF." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { success: false, error: "La imagen supera el tamaño máximo permitido (15MB)." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext) ? ext : "jpg";
  const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "");
  const path = `${cleanFolder}/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from("productos")
    .upload(path, file, { cacheControl: "3600", upsert: true });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  const { data: urlData } = supabase.storage.from("productos").getPublicUrl(path);
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

  const payload: Record<string, any> = {
    nombre,
    slug: uniqueSlug,
    descripcion: String(formData.get("descripcion") || "") || null,
    categoria_id: selectedCategoria,
    produccion_id: produccionId,
    precio_base: Number(formData.get("precioBase")) || 0,
    es_personalizable: formData.get("esPersonalizable") === "on",
    stock_disponible: Number(formData.get("stockDisponible")) || 1,
    es_entrega_inmediata: false,
    activo: false, // Always draft in production mode until collection publication
  };

  if (tipoCatalogo) payload.tipo_catalogo = tipoCatalogo;


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

export async function actualizarProduccionSinRelanzarAction(
  produccionId: string,
): Promise<{ success: boolean; error?: string; count?: number }> {
  const supabase = await createClient();

  // Make sure produccion is marked active
  await supabase
    .from("producciones")
    .update({ activa: true })
    .eq("id", produccionId);

  // Set all products in this production to active=true WITHOUT touching fecha_lanzamiento
  const { data, error } = await supabase
    .from("productos")
    .update({ activo: true })
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
  targetId: string,
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  // SECURITY (C7): Validate UUID format strictly before using in query filter
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
  if (!isValidUUID) {
    return { success: false, error: "Identificador inválido." };
  }

  // Unlink products from this production so products stay in the catalog
  await supabase
    .from("productos")
    .update({ produccion_id: null })
    .or(`produccion_id.eq.${targetId},categoria_id.eq.${targetId}`);

  // Delete production record and category record if applicable
  const { error: prodErr } = await supabase.from("producciones").delete().eq("id", targetId);
  const { error: catErr } = await supabase.from("categorias").delete().eq("id", targetId);

  if (prodErr && catErr) {
    return { success: false, error: catErr.message || prodErr.message };
  }

  revalidatePath("/admin/produccion");
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/productos");
  revalidatePath("/catalogo");
  revalidatePath("/colecciones");
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
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "Seleccioná un archivo de logo" };
  }

  // SECURITY (B5): Validate MIME type and file size
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
  const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Tipo de archivo no permitido para logo. Usá PNG, JPG, WEBP o SVG." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { success: false, error: "El logo supera el tamaño máximo permitido (5MB)." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const safeExt = ["png", "jpg", "jpeg", "webp", "svg"].includes(ext) ? ext : "png";
  const path = `logo_${Date.now()}.${safeExt}`;

  // Use 'productos' bucket as primary storage bucket
  const { error: uploadError } = await supabase.storage.from("productos").upload(path, file);
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
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  const file = formData.get("heroImage") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "Seleccioná una imagen de portada" };
  }

  // SECURITY (B5): Validate MIME type and file size
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: "Tipo de archivo no permitido. Usá JPG, PNG o WEBP." };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { success: false, error: "La imagen supera el tamaño máximo permitido (10MB)." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
  const path = `hero_${Date.now()}.${safeExt}`;

  // Use 'productos' bucket as primary storage bucket
  const { error: uploadError } = await supabase.storage.from("productos").upload(path, file);
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
  // SECURITY (B4): Only admins should be able to manually trigger order expiration.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado" };

  const { isUserAdmin } = await import("@/lib/supabase/queries");
  const admin = await isUserAdmin(user.id);
  if (!admin) return { success: false, error: "No autorizado" };

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

  // SECURITY: Ignore client-supplied prices. Recalculate from DB configuration.
  const { data: configEncargos } = await supabase
    .from("configuracion_encargos")
    .select("precio_marco_madera, porcentaje_recargo_personalizado, medidas_ilustraciones")
    .limit(1)
    .single();

  const precioMarcoMadera = Number(configEncargos?.precio_marco_madera ?? 8500);
  const porcentajeRecargo = Number(configEncargos?.porcentaje_recargo_personalizado ?? 0.15);

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

  // SECURITY: Parse and validate itemsJson structure (C5)
  const itemsJsonRaw = formData.get("itemsJson") as string;
  let itemsArray: any[] = [];
  if (itemsJsonRaw) {
    try {
      const parsed = JSON.parse(itemsJsonRaw);
      if (Array.isArray(parsed)) {
        itemsArray = parsed;
      }
    } catch (e) { /* invalid JSON — use empty */ }
  }

  const firstItem = itemsArray[0];

  // SECURITY: Recalculate totals server-side
  let serverPrecioEstimado = 0;
  let serverRecargoPersonalizado = 0;
  const serverAdicionalMedida = 0;
  let serverAdicionalMarco = 0;


  for (const it of itemsArray) {
    const precioBase = Number(it.precioBase) || 0;
    const cantidad = Number(it.cantidad) || 1;
    const itemEsPersonalizado = Boolean(it.esPersonalizado);
    const itemConMarco = Boolean(it.conMarco);

    // If the item references a real product, verify the price from DB
    let precioBaseVerificado = precioBase;
    if (it.productoId) {
      const { data: prod } = await supabase
        .from("productos")
        .select("precio_base")
        .eq("id", it.productoId)
        .eq("activo", true)
        .single();
      if (prod) precioBaseVerificado = Number(prod.precio_base);
    }

    const recargo = itemEsPersonalizado ? Math.round(precioBaseVerificado * porcentajeRecargo) : 0;
    const adicionalMarco = itemConMarco ? precioMarcoMadera : 0;
    const precioUnitarioFinal = precioBaseVerificado + recargo + adicionalMarco;

    serverPrecioEstimado += precioBaseVerificado * cantidad;
    serverRecargoPersonalizado += recargo * cantidad;
    serverAdicionalMarco += adicionalMarco * cantidad;
  }

  const serverTotalEstimado = serverPrecioEstimado + serverRecargoPersonalizado + serverAdicionalMedida + serverAdicionalMarco;

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
      precio_estimado: serverPrecioEstimado,
      recargo_personalizado: serverRecargoPersonalizado,
      adicional_medida: serverAdicionalMedida,
      adicional_marco: serverAdicionalMarco,
      total_estimado: serverTotalEstimado,
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

const MILIDEAS_GEMINI_PROMPT = `Sos la asistente de escritura de Milideas Arte, un emprendimiento de cerámica artesanal y piezas ilustradas a mano.

Tu tarea es analizar la fotografía de una pieza y redactar automáticamente una descripción para la tienda online, como si la hubiera escrito la propia artista.

La descripción debe sentirse humana, cercana y auténtica.

NO escribas como una empresa.
NO escribas como un catálogo industrial.
NO escribas como una agencia de marketing.
NO utilices lenguaje corporativo.
NO hagas descripciones genéricas de ecommerce.

Escribí como una artista argentina que está mostrando con ilusión una pieza que hizo con sus propias manos.

==================================================
IDENTIDAD DE MILIDEAS ARTE
==================================================

Milideas Arte es un emprendimiento artesanal de Sunchales, Argentina.

La artista crea piezas de cerámica y otras obras ilustradas a mano.

Sus piezas pueden incluir:

- tazas
- cuencos
- bandejas
- jarras
- platos
- objetos decorativos
- piezas personalizadas
- animales
- flores
- plantas
- paisajes
- personajes
- soles
- elementos de la naturaleza
- escenas ilustradas
- pequeños detalles modelados
- relieves
- acabados especiales

Cada pieza tiene un componente artístico y artesanal.

No debe sentirse como un producto fabricado en serie.

La personalidad de la marca es:

✨ cálida
🌈 colorida
💗 cercana
🎨 artística
🌿 natural
🐱 juguetona
🌞 alegre
🖐️ artesanal
🔎 curiosa
📖 narrativa

==================================================
VOZ DE LA ARTISTA
==================================================

Escribí utilizando español argentino y voseo.

La voz debe sentirse:

- espontánea
- cálida
- alegre
- cercana
- imperfectamente humana
- entusiasta
- artesanal
- conversacional

La artista puede hablarle directamente a quien está mirando la pieza.

Ejemplos del tipo de tono que buscamos:

"Esta tacita nació..."
"Me encantó cómo quedó..."
"Una de esas piezas que..."
"Si te gustan los..."
"Ya sabés..."
"Ojalá les guste tanto como a mí..."
"Le fui sumando..."
"Esta vez quise..."
"Me llevó un tiempito..."
"Quedó llena de..."
"Me encanta cómo..."

IMPORTANTE:

Estos ejemplos son únicamente referencias de tono.

NO copies literalmente estas frases en todas las descripciones.

Variá la forma de expresarte para evitar que todas las descripciones parezcan generadas por la misma plantilla.

==================================================
ANÁLISIS DE LA IMAGEN
==================================================

Antes de escribir, analizá cuidadosamente la fotografía.

Identificá, SOLO cuando puedas observarlo con suficiente seguridad:

1. Tipo de pieza.
2. Forma.
3. Color principal.
4. Colores secundarios.
5. Ilustraciones.
6. Animales.
7. Plantas.
8. Flores.
9. Personajes.
10. Paisajes.
11. Objetos representados.
12. Relieves.
13. Elementos modelados.
14. Texturas visibles.
15. Acabado visual.
16. Asa, borde, tapa u otros elementos.
17. Detalles particulares.
18. Combinaciones de colores.
19. Sensación general de la pieza.

Prestá especial atención a los pequeños detalles.

Muchas piezas de Milideas Arte tienen elementos pequeños que forman parte de su encanto.

==================================================
REGLA FUNDAMENTAL: NO INVENTAR
==================================================

Nunca inventes información.

Si algo no puede determinarse claramente a partir de la fotografía, NO lo afirmes como un hecho.

Por ejemplo:

Si no podés determinar que el esmalte es brillante:
NO escribas "con esmalte brillante".

Si no podés saber el material exacto:
NO inventes el material.

Si no podés determinar las dimensiones:
NO inventes medidas.

Si no podés saber si es apta para microondas:
NO lo menciones.

Si no podés identificar exactamente un animal:
describilo de forma general.

Si algo parece ser un gato pero no estás completamente segura:
podés decir "un animalito" o "un pequeño personaje".

Diferenciá siempre entre:

HECHO OBSERVABLE
e
INTERPRETACIÓN ARTÍSTICA.

Podés ser poética al interpretar la pieza, pero no inventes especificaciones técnicas.

==================================================
ESTILO DE REDACCIÓN
==================================================

La descripción debe tener aproximadamente 2 párrafos breves.

Debe sentirse natural y no excesivamente elaborada.

No busques utilizar palabras sofisticadas solamente para parecer premium.

La personalidad debe surgir de los detalles.

Preferí:

"Una tacita llena de pequeños animalitos..."

antes que:

"Una exquisita pieza de cerámica de carácter contemporáneo..."

Preferí:

"Me encantó cómo se mezclaron estos colores..."

antes que:

"Esta pieza presenta una armoniosa combinación cromática..."

La artista NO habla como una crítica de arte.

Habla como alguien que disfruta profundamente crear sus piezas y compartirlas.

==================================================
NARRATIVA
==================================================

Cuando la imagen lo permita, intentá contar una pequeña historia.

No describas únicamente lo que se ve.

Podés explicar:

- qué sensación transmite
- qué detalle te llamó la atención
- qué hace especial a la pieza
- cómo se relacionan los colores
- qué historia parece contar la ilustración
- qué pequeño detalle puede descubrir quien la tenga en sus manos

La descripción debe hacer que el comprador sienta ganas de mirar la pieza un poco más.

==================================================
EMOJIS
==================================================

Los emojis forman parte de la identidad de Milideas Arte.

Podés utilizar entre 1 y 4 emojis cuando tengan sentido.

Elegilos según la pieza.

Ejemplos:

🐱 animales
🐶 perros
🌸 flores
🌿 naturaleza
🌞 soles
🌈 colores
💗 cariño
✨ detalles especiales
🎨 arte
🧡 calidez
🍓 frutas
🏔️ montañas

NO llenes la descripción de emojis.

No pongas emojis simplemente para decorar.

Deben sentirse naturales dentro de la voz de la artista.

==================================================
TÍTULO DEL PRODUCTO
==================================================

Si recibís un título del producto, utilizalo como contexto.

No lo repitas innecesariamente.

Si el título contradice claramente lo que aparece en la fotografía, NO inventes una explicación.

Indicá internamente que existe una posible inconsistencia.

==================================================
DESCRIPCIÓN PARA ECOMMERCE
==================================================

La descripción debe funcionar dentro de una tienda online.

Debe ser emocional pero también útil.

Cuando la información sea visible o haya sido proporcionada explícitamente, incorporá naturalmente:

- tipo de pieza
- características visibles
- colores
- ilustraciones
- detalles
- variantes
- tamaño
- cantidad
- particularidades

Pero nunca inventes datos técnicos.

No conviertas la descripción en una ficha técnica.

La información técnica deberá permanecer separada de la descripción narrativa.

==================================================
VARIACIÓN
==================================================

NO utilices siempre la misma estructura.

Alterná entre diferentes formas de comenzar:

- una observación sobre la pieza
- una emoción de la artista
- una historia
- un detalle pequeño
- los colores
- el personaje principal
- una escena
- una frase espontánea

Evitá comenzar siempre con:

"Esta pieza..."

"Esta hermosa..."

"Una hermosa..."

"Descubrí..."

==================================================
EVITAR
==================================================

No utilices:

"producto premium"
"experiencia única"
"eleva tus espacios"
"pieza exclusiva" salvo que realmente corresponda
"diseño sofisticado"
"calidad excepcional"
"ideal para cualquier ocasión"
"hecho con amor" como frase automática
"una verdadera obra de arte" como cliché
"must-have"
"imperdible"
"lujo"
"exquisito"
"sofisticado"

No utilices lenguaje de publicidad genérica.

No exageres.

No conviertas cada pieza en una obra maestra grandilocuente.

La autenticidad es más importante que vender agresivamente.

==================================================
LONGITUD
==================================================

Generá aproximadamente entre 50 y 100 palabras.

Preferí una descripción breve y memorable antes que una descripción larga y repetitiva.

Si la imagen tiene muchos detalles interesantes, podés acercarte al límite superior.

==================================================
IMPORTANTE SOBRE LA ARTISTA
==================================================

No digas:

"La artista creó..."

"El artesano realizó..."

"La marca ofrece..."

Escribí en primera persona cuando tenga sentido.

Ejemplo:

"Me encantó cómo quedó este..."

"Para esta pieza quise..."

"Le fui sumando..."

"Esta vez apareció..."

La descripción debe parecer escrita por la propia artista.

==================================================
CONTROL DE CALIDAD
==================================================

Antes de entregar la descripción, verificá internamente:

✓ ¿Estoy describiendo realmente lo que aparece en la imagen?
✓ ¿Inventé alguna característica?
✓ ¿Suena como una persona real?
✓ ¿Suena como una artista argentina?
✓ ¿Estoy usando voseo correctamente?
✓ ¿Tiene personalidad?
✓ ¿Estoy destacando algún detalle particular?
✓ ¿Es demasiado publicitaria?
✓ ¿Estoy repitiendo una estructura utilizada anteriormente?
✓ ¿Los emojis tienen sentido?
✓ ¿La descripción ayuda a imaginar la pieza?
✓ ¿Se siente como Milideas Arte?

Si alguna respuesta es negativa, corregí la descripción antes de entregarla.

==================================================
FORMATO DE RESPUESTA
==================================================

Devolvé ÚNICAMENTE la descripción final.

No expliques tu análisis.

No enumeres los elementos detectados.

No digas qué viste en la imagen antes de la descripción.

No agregues títulos como "Descripción:".

No utilices comillas.

No agregues notas para la artista.

La salida debe estar lista para copiar directamente en el campo "Descripción" del producto.`;

export async function generarDescripcionProductoIAAction(
  imageUrl: string | null,
  nombreProducto?: string,
): Promise<{ success: boolean; descripcion?: string; error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "Falta la clave GEMINI_API_KEY en las variables de entorno.",
      };
    }

    const parts: any[] = [];

    if (imageUrl) {
      if (imageUrl.startsWith("data:")) {
        const matches = imageUrl.match(/^data:(image\/(?:jpeg|png|webp|gif|svg\+xml));base64,(.+)$/);
        if (matches) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2],
            },
          });
        }
      } else {
        // SECURITY (B6): SSRF Protection — only allow safe HTTPS URLs, disallow private/internal IPs
        try {
          const parsedUrl = new URL(imageUrl);
          const isHttps = parsedUrl.protocol === "https:";
          const hostname = parsedUrl.hostname.toLowerCase();

          const isForbiddenHost =
            hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            hostname === "0.0.0.0" ||
            hostname === "169.254.169.254" || // AWS/GCP/Azure instance metadata
            hostname.startsWith("10.") ||
            hostname.startsWith("192.168.") ||
            hostname.startsWith("172.16.") ||
            hostname.endsWith(".internal") ||
            hostname.endsWith(".local");

          if (isHttps && !isForbiddenHost) {
            const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(8000) });
            if (imgRes.ok) {
              const arrayBuf = await imgRes.arrayBuffer();
              const base64Data = Buffer.from(arrayBuf).toString("base64");
              const contentType = imgRes.headers.get("content-type") || "image/jpeg";

              if (contentType.startsWith("image/")) {
                parts.push({
                  inlineData: {
                    mimeType: contentType,
                    data: base64Data,
                  },
                });
              }
            }
          }
        } catch (err) {
          console.warn("No se pudo descargar la imagen para Gemini:", err);
        }
      }
    }


    const contextText = nombreProducto
      ? `\n\n==================================================\nTÍTULO DEL PRODUCTO RECIBIDO:\n"${nombreProducto}"\n==================================================`
      : "";

    parts.push({
      text: `${MILIDEAS_GEMINI_PROMPT}${contextText}`,
    });

    const isOAuthToken = apiKey.startsWith("AQ.") || apiKey.startsWith("ya29.");

    const candidateModels = [
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-3.1-pro",
      "gemini-3-flash",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
    ];

    let lastErrorStatus = 0;
    let lastErrorText = "";

    for (const model of candidateModels) {
      const endpoint = isOAuthToken
        ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
        : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (isOAuthToken) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      } else {
        headers["x-goog-api-key"] = apiKey;
      }

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({
            contents: [{ parts }],
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const generatedText =
            data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

          if (generatedText) {
            return {
              success: true,
              descripcion: generatedText,
            };
          }
        } else {
          lastErrorStatus = res.status;
          lastErrorText = await res.text();
          console.warn(`Gemini model ${model} status ${res.status}:`, lastErrorText);
        }
      } catch (err: any) {
        console.warn(`Fetch error for Gemini model ${model}:`, err);
      }
    }

    if (lastErrorStatus === 429) {
      return {
        success: false,
        error: "Se alcanzó el límite de solicitudes por minuto de la API gratuita de Gemini. Por favor esperá 30 segundos y volvé a presionar el botón.",
      };
    }

    return {
      success: false,
      error: `Error de Gemini API (${lastErrorStatus || 404}). Detalle: ${lastErrorText.slice(0, 150)}`,
    };
  } catch (err: any) {
    console.error("generarDescripcionProductoIAAction error:", err);
    return {
      success: false,
      error: err?.message || "Error al conectar con el servicio de IA.",
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ACCIONES ADMIN: FORMATOS DE CATÁLOGO BASE (Cerámica e Ilustración)
// ═══════════════════════════════════════════════════════════════════════════

export async function updateFormatoPrecioAction(
  id: string,
  nuevoPrecio: number,
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  if (isNaN(nuevoPrecio) || nuevoPrecio < 0) {
    return { success: false, error: "El precio debe ser un número válido mayor o igual a 0." };
  }

  const { error } = await supabase
    .from("formatos_catalogo")
    .update({ precio_base: nuevoPrecio, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/ceramica");
  revalidatePath("/ilustracion");
  revalidatePath("/admin/ceramica");
  revalidatePath("/admin/ilustracion");
  return { success: true };
}

export async function saveFormatoAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  const id = formData.get("id") as string | null;
  const rubro = (formData.get("rubro") as string) || "ceramica";
  const nombre = String(formData.get("nombre") || "").trim();
  const categoria = String(formData.get("categoria") || "").trim() || null;
  const medidas = String(formData.get("medidas") || "").trim() || null;
  const precioBase = Number(formData.get("precioBase") || 0);
  const fotoUrl = (formData.get("fotoUrl") as string) || null;
  const orden = Number(formData.get("orden") || 0);
  const activo = formData.get("activo") !== "false";

  if (!nombre) {
    return { success: false, error: "El nombre de la pieza es obligatorio." };
  }

  const payload = {
    rubro,
    nombre,
    categoria,
    medidas,
    precio_base: precioBase,
    foto_url: fotoUrl,
    orden,
    activo,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from("formatos_catalogo").update(payload).eq("id", id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("formatos_catalogo").insert(payload);
    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/ceramica");
  revalidatePath("/ilustracion");
  revalidatePath("/admin/ceramica");
  revalidatePath("/admin/ilustracion");
  return { success: true };
}

export async function deleteFormatoAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  const { error } = await supabase.from("formatos_catalogo").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/ceramica");
  revalidatePath("/ilustracion");
  revalidatePath("/admin/ceramica");
  revalidatePath("/admin/ilustracion");
  return { success: true };
}

export async function aumentarPreciosMasivoAction(
  rubro: "ceramica" | "ilustracion",
  porcentaje: number,
  categoria?: string,
): Promise<{ success: boolean; actualizados?: number; error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  if (isNaN(porcentaje) || porcentaje === 0) {
    return { success: false, error: "Ingresá un porcentaje de ajuste válido (ej. 5 para +5%)." };
  }

  let query = supabase
    .from("formatos_catalogo")
    .select("id, precio_base")
    .eq("rubro", rubro);

  if (categoria && categoria !== "todas") {
    query = query.eq("categoria", categoria);
  }

  const { data: formatos, error: fetchErr } = await query;
  if (fetchErr || !formatos) {
    return { success: false, error: fetchErr?.message || "Error al consultar los formatos." };
  }

  const factor = 1 + porcentaje / 100;
  let count = 0;

  for (const f of formatos) {
    const nuevoPrecio = Math.round(Number(f.precio_base) * factor);
    const { error: updErr } = await supabase
      .from("formatos_catalogo")
      .update({ precio_base: nuevoPrecio, updated_at: new Date().toISOString() })
      .eq("id", f.id);
    if (!updErr) count++;
  }

  revalidatePath("/ceramica");
  revalidatePath("/ilustracion");
  revalidatePath("/admin/ceramica");
  revalidatePath("/admin/ilustracion");
  return { success: true, actualizados: count };
}

// ═══════════════════════════════════════════════════════════════════════════
// ACCIONES ADMIN: PORTFOLIO DE COLECCIONES
// ═══════════════════════════════════════════════════════════════════════════

export async function savePortfolioColeccionAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  const id = formData.get("id") as string | null;
  const rubro = (formData.get("rubro") as string) || "ceramica";
  const nombre = String(formData.get("nombre") || "").trim();
  const descripcion = String(formData.get("descripcion") || "").trim() || null;
  const portadaUrl = (formData.get("portadaUrl") as string) || null;
  const fotosRaw = String(formData.get("fotos") || "[]");
  const disenosRaw = String(formData.get("disenosDisponibles") || "[]");
  const orden = Number(formData.get("orden") || 0);
  const activa = formData.get("activa") !== "false";

  if (!nombre) {
    return { success: false, error: "El nombre de la colección es obligatorio." };
  }

  let fotos = [];
  try {
    fotos = JSON.parse(fotosRaw);
  } catch {
    fotos = [];
  }

  let disenosDisponibles = [];
  try {
    disenosDisponibles = JSON.parse(disenosRaw);
  } catch {
    disenosDisponibles = [];
  }

  const payload = {
    rubro,
    nombre,
    descripcion,
    portada_url: portadaUrl || (fotos[0] ?? null),
    fotos,
    disenos_disponibles: disenosDisponibles,
    orden,
    activa,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from("portfolio_colecciones").update(payload).eq("id", id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("portfolio_colecciones").insert(payload);
    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/ceramica");
  revalidatePath("/ilustracion");
  revalidatePath("/admin/ceramica");
  revalidatePath("/admin/ilustracion");
  return { success: true };
}

export async function deletePortfolioColeccionAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  const { error } = await supabase.from("portfolio_colecciones").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/ceramica");
  revalidatePath("/ilustracion");
  revalidatePath("/admin/ceramica");
  revalidatePath("/admin/ilustracion");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// ACCIONES ADMIN: OBRAS & PROYECTOS ESPECIALES
// ═══════════════════════════════════════════════════════════════════════════

export async function saveObraProyectoAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  const id = formData.get("id") as string | null;
  const categoria = (formData.get("categoria") as string) || "murales";
  const titulo = String(formData.get("titulo") || "").trim();
  const subtitulo = String(formData.get("subtitulo") || "").trim() || null;
  const descripcion = String(formData.get("descripcion") || "").trim() || null;
  const clienteLugar = String(formData.get("clienteLugar") || "").trim() || null;
  const portadaUrl = (formData.get("portadaUrl") as string) || null;
  const fotosRaw = String(formData.get("fotos") || "[]");
  const destacadoHome = formData.get("destacadoHome") === "true";
  const orden = Number(formData.get("orden") || 0);
  const activo = formData.get("activo") !== "false";

  if (!titulo) {
    return { success: false, error: "El título del proyecto es obligatorio." };
  }

  let fotos = [];
  try {
    fotos = JSON.parse(fotosRaw);
  } catch {
    fotos = [];
  }

  const payload = {
    categoria,
    titulo,
    subtitulo,
    descripcion,
    cliente_lugar: clienteLugar,
    portada_url: portadaUrl || (fotos[0] ?? null),
    fotos,
    destacado_home: destacadoHome,
    orden,
    activo,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from("obras_proyectos").update(payload).eq("id", id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("obras_proyectos").insert(payload);
    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/obras");
  revalidatePath("/admin/obras");
  return { success: true };
}

export async function deleteObraProyectoAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  const { error } = await supabase.from("obras_proyectos").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/obras");
  revalidatePath("/admin/obras");
  return { success: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// ACCIONES ADMIN: GESTIÓN DIRECTA DE STOCK / DROPS & SYNC CON PORTFOLIO
// ═══════════════════════════════════════════════════════════════════════════

export async function updateProductoStockInlineAction(
  id: string,
  nuevoStock: number,
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  const stockVal = Math.max(0, Math.floor(nuevoStock));

  const { error } = await supabase
    .from("productos")
    .update({
      stock_disponible: stockVal,
      es_entrega_inmediata: stockVal > 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/ceramica");
  revalidatePath("/ilustracion");
  revalidatePath("/admin/ceramica");
  revalidatePath("/admin/ilustracion");
  return { success: true };
}

export async function updateProductoColeccionInlineAction(
  productoId: string,
  nuevaColeccionNombre: string,
  rubro: "ceramica" | "ilustracion" = "ceramica",
): Promise<{ success: boolean; categoriaId?: string; error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  const nombreLimpio = nuevaColeccionNombre.trim();
  const tipoCatalogo = rubro === "ceramica" ? "ceramica" : "ilustraciones";

  let targetCatId: string | null = null;

  if (nombreLimpio && nombreLimpio !== "Sin colección") {
    // Buscar si existe la categoría
    const { data: existente } = await supabase
      .from("categorias")
      .select("id")
      .eq("tipo_catalogo", tipoCatalogo)
      .ilike("nombre", nombreLimpio)
      .maybeSingle();

    if (existente) {
      targetCatId = existente.id;
    } else {
      const { data: creada, error: crErr } = await supabase
        .from("categorias")
        .insert({ nombre: nombreLimpio, tipo_catalogo: tipoCatalogo })
        .select("id")
        .single();
      if (crErr || !creada) return { success: false, error: crErr?.message || "Error al crear colección" };
      targetCatId = creada.id;
    }
  }

  const { error: updErr } = await supabase
    .from("productos")
    .update({
      categoria_id: targetCatId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productoId);

  if (updErr) return { success: false, error: updErr.message };

  revalidatePath("/");
  revalidatePath("/ceramica");
  revalidatePath("/ilustracion");
  revalidatePath("/admin/ceramica");
  revalidatePath("/admin/ilustracion");
  return { success: true, categoriaId: targetCatId || undefined };
}

export async function saveStockPiezaDirectaAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  const id = formData.get("id") as string | null;
  const rubro = (formData.get("rubro") as string) || "ceramica";
  const tipoCatalogo = rubro === "ceramica" ? "ceramica" : "ilustraciones";
  const nombre = String(formData.get("nombre") || "").trim();
  const categoriaId = (formData.get("categoriaId") as string) || null;
  const coleccionNombre = String(formData.get("coleccionNombre") || "").trim();
  const precioBase = Number(formData.get("precioBase") || 0);
  const stockDisponible = Number(formData.get("stockDisponible") || 1);
  const descripcion = String(formData.get("descripcion") || "").trim() || null;
  const fotosRaw = String(formData.get("fotos") || "[]");

  if (!nombre) {
    return { success: false, error: "El nombre de la pieza es obligatorio." };
  }

  let fotos: string[] = [];
  try {
    fotos = JSON.parse(fotosRaw);
  } catch {
    fotos = [];
  }

  // Generar slug
  const slug = `${nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString().slice(-4)}`;

  let finalCategoriaId = categoriaId;

  // Si especificó un nombre de colección/categoría nueva y no viene ID
  if (coleccionNombre && !categoriaId) {
    const { data: catNueva } = await supabase
      .from("categorias")
      .insert({ nombre: coleccionNombre, tipo_catalogo: tipoCatalogo })
      .select("id")
      .single();
    if (catNueva) finalCategoriaId = catNueva.id;
  }

  const payload: Record<string, any> = {
    nombre,
    precio_base: precioBase,
    stock_disponible: stockDisponible,
    es_entrega_inmediata: stockDisponible > 0,
    activo: true,
    tipo_catalogo: tipoCatalogo,
    categoria_id: finalCategoriaId,
    descripcion,
    updated_at: new Date().toISOString(),
  };

  let targetId = id;

  if (id) {
    const { error: updErr } = await supabase.from("productos").update(payload).eq("id", id);
    if (updErr) return { success: false, error: updErr.message };
  } else {
    payload.slug = slug;
    const { data: nuevoProd, error: insErr } = await supabase
      .from("productos")
      .insert(payload)
      .select("id")
      .single();
    if (insErr || !nuevoProd) return { success: false, error: insErr?.message || "Error al crear pieza" };
    targetId = nuevoProd.id;
  }

  // Actualizar imágenes
  if (targetId && fotos.length > 0) {
    // Si es edición, reemplazamos o actualizamos
    if (id) {
      await supabase.from("producto_imagenes").delete().eq("producto_id", targetId);
    }
    const imagenesToInsert = fotos.map((url, idx) => ({
      producto_id: targetId!,
      url_imagen: url,
      orden: idx,
    }));
    await supabase.from("producto_imagenes").insert(imagenesToInsert);
  }

  // Sincronización automática con Portfolio si hay fotos y nombre de colección
  if (coleccionNombre && fotos.length > 0) {
    const { data: colExistente } = await supabase
      .from("portfolio_colecciones")
      .select("id, fotos")
      .eq("rubro", rubro)
      .ilike("nombre", coleccionNombre)
      .maybeSingle();

    if (colExistente) {
      const fotosActuales = Array.isArray(colExistente.fotos) ? colExistente.fotos : [];
      const combinadas = Array.from(new Set([...fotosActuales, ...fotos]));
      await supabase
        .from("portfolio_colecciones")
        .update({
          fotos: combinadas,
          portada_url: combinadas[0] || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", colExistente.id);
    } else {
      await supabase.from("portfolio_colecciones").insert({
        rubro: rubro as "ceramica" | "ilustracion",
        nombre: coleccionNombre,
        descripcion: descripcion || `Piezas de la ${coleccionNombre}`,
        portada_url: fotos[0] || null,
        fotos,
        disenos_disponibles: [nombre],
        activa: true,
      });
    }
  }

  revalidatePath("/");
  revalidatePath("/ceramica");
  revalidatePath("/ilustracion");
  revalidatePath("/admin/ceramica");
  revalidatePath("/admin/ilustracion");
  return { success: true };
}

export async function deleteStockPiezaDirectaAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  await supabase.from("producto_imagenes").delete().eq("producto_id", id);
  const { error } = await supabase.from("productos").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/ceramica");
  revalidatePath("/ilustracion");
  revalidatePath("/admin/ceramica");
  revalidatePath("/admin/ilustracion");
  return { success: true };
}

export async function lanzarColeccionDropCompletaAction(data: {
  rubro: "ceramica" | "ilustracion";
  nombreColeccion: string;
  descripcion?: string;
  piezas: Array<{
    nombre: string;
    precioBase: number;
    stock: number;
    fotos: string[];
    descripcion?: string;
  }>;
}): Promise<{ success: boolean; error?: string }> {
  const auth = await requireAdmin();
  if ("error" in auth) return { success: false, error: auth.error };
  const { supabase } = auth;

  const { rubro, nombreColeccion, descripcion, piezas } = data;
  if (!nombreColeccion.trim() || piezas.length === 0) {
    return { success: false, error: "Ingresá el nombre del lanzamiento y al menos una pieza." };
  }

  const tipoCatalogo = rubro === "ceramica" ? "ceramica" : "ilustraciones";

  // 1. Crear categoría para agrupar las piezas del drop
  const { data: categoria, error: catErr } = await supabase
    .from("categorias")
    .insert({ nombre: nombreColeccion.trim(), tipo_catalogo: tipoCatalogo })
    .select("id")
    .single();

  if (catErr || !categoria) {
    return { success: false, error: catErr?.message || "Error al registrar la colección." };
  }

  const todasLasFotosDeLaColeccion: string[] = [];
  const nombresDeDisenos: string[] = [];

  // 2. Insertar cada pieza de stock
  for (const p of piezas) {
    const slug = `${p.nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString().slice(-4)}`;
    const { data: prod, error: pErr } = await supabase
      .from("productos")
      .insert({
        nombre: p.nombre,
        slug,
        precio_base: p.precioBase,
        stock_disponible: p.stock,
        es_entrega_inmediata: p.stock > 0,
        activo: true,
        categoria_id: categoria.id,
        tipo_catalogo: tipoCatalogo,
        descripcion: p.descripcion || null,
      })
      .select("id")
      .single();

    if (!pErr && prod && p.fotos.length > 0) {
      todasLasFotosDeLaColeccion.push(...p.fotos);
      nombresDeDisenos.push(p.nombre);
      const imgRows = p.fotos.map((url, i) => ({
        producto_id: prod.id,
        url_imagen: url,
        orden: i,
      }));
      await supabase.from("producto_imagenes").insert(imgRows);
    }
  }

  // 3. Sincronización automática con Portfolio: Creamos el álbum visual
  const fotosUnicas = Array.from(new Set(todasLasFotosDeLaColeccion));
  if (fotosUnicas.length > 0) {
    await supabase.from("portfolio_colecciones").insert({
      rubro,
      nombre: nombreColeccion.trim(),
      descripcion: descripcion || `Lanzamiento y colección ${nombreColeccion}`,
      portada_url: fotosUnicas[0] || null,
      fotos: fotosUnicas,
      disenos_disponibles: nombresDeDisenos,
      activa: true,
    });
  }

  revalidatePath("/");
  revalidatePath("/ceramica");
  revalidatePath("/ilustracion");
  revalidatePath("/admin/ceramica");
  revalidatePath("/admin/ilustracion");
  return { success: true };
}



