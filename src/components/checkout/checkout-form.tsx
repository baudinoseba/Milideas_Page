"use client";

import { useEffect, useState, useTransition, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/ui/google-button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/modal";
import { formatPrecio } from "@/lib/pricing";
import { calcularCostoEnvio, obtenerCostoAutomaticoProximidad, getTipoEnvioLabel } from "@/lib/shipping";
import { crearPedidoAction, loginAction } from "@/lib/actions";
import { useCartStore } from "@/stores/cart-store";
import { CheckoutSteps } from "@/components/checkout/checkout-steps";
import { TerminosModal } from "@/components/checkout/terminos-modal";
import { CartReservationTimer } from "@/components/cart/cart-reservation-timer";
import { WhatsAppIcon } from "@/components/ui/whatsapp-icon";
import type { MetodoPago, TipoEnvio, ZonaLogistica, Perfil } from "@/types";

const PROVINCIAS_ARGENTINAS = [
  "Buenos Aires",
  "CABA",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];

export function CheckoutForm({
  zonas,
  perfil,
  userEmail,
}: {
  zonas: ZonaLogistica[];
  perfil?: Perfil | null;
  userEmail?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [loginPending, startLoginTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"info" | "success" | "error">("info");

  // Step state
  const [step, setStep] = useState<2 | 3 | 4>(2);
  const [termsOpen, setTermsOpen] = useState(false);

  // Authenticated state
  const [perfilState, setPerfilState] = useState<Perfil | null>(perfil ?? null);
  const [userEmailState, setUserEmailState] = useState<string>(userEmail ?? "");

  // Form states
  const [step2Data, setStep2Data] = useState({
    nombreContacto: perfil?.nombre_completo?.split(" ")[0] ?? "",
    apellidoContacto: perfil?.nombre_completo?.split(" ").slice(1).join(" ") ?? "",
    whatsappContacto: perfil?.whatsapp ?? "",
    emailContacto: userEmail ?? "",
    dni: perfil?.dni ?? "",
    fechaNacimiento: "",
  });

  const [step3Data, setStep3Data] = useState({
    tipoEnvio: (perfil?.direccion_calle ? "domicilio" : "agencia") as TipoEnvio,
    zonaLogisticaId: perfil?.direccion_calle 
      ? (zonas.find(z => z.precio_domicilio > 0)?.id ?? zonas[0]?.id ?? "")
      : (zonas[0]?.id ?? ""),
    calle: perfil?.direccion_calle ?? "",
    numero: perfil?.direccion_numero ?? "",
    piso: perfil?.direccion_piso ?? "",
    depto: perfil?.direccion_depto ?? "",
    ciudad: perfil?.direccion_ciudad ?? "",
    provincia: perfil?.direccion_provincia ?? "",
    codigoPostal: perfil?.direccion_codigo_postal ?? "",
    referencia: perfil?.direccion_referencia ?? "",
    alias: "CASA",
    barrio: "",
  });

  const [metodoPago, setMetodoPago] = useState<MetodoPago>("transferencia");
  const [aceptarTerminos, setAceptarTerminos] = useState(false);

  // Errors
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});
  const [step3Errors, setStep3Errors] = useState<Record<string, string>>({});

  const items = useCartStore((s) => s.items);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const clearCart = useCartStore((s) => s.clearCart);
  const toRpcItems = useCartStore((s) => s.toRpcItems);

  // Dynamic calculations with Automatic Proximity Algorithm by Province
  const autoShipping = obtenerCostoAutomaticoProximidad(
    step3Data.provincia,
    step3Data.ciudad,
    step3Data.tipoEnvio,
    zonas
  );
  const costoEnvio = autoShipping.precio;
  const pricing = useCartStore.getState().getPricing(metodoPago, costoEnvio);

  // Redirect if cart is empty
  useEffect(() => {
    if (isClient && items.length === 0) {
      router.push("/carrito");
    }
  }, [isClient, items.length, router]);

  // Sync profile values if they change (e.g. after login)
  useEffect(() => {
    if (perfilState) {
      setStep2Data((prev) => ({
        ...prev,
        nombreContacto: perfilState.nombre_completo?.split(" ")[0] ?? prev.nombreContacto,
        apellidoContacto: perfilState.nombre_completo?.split(" ").slice(1).join(" ") ?? prev.apellidoContacto,
        whatsappContacto: perfilState.whatsapp ?? prev.whatsappContacto,
        emailContacto: userEmailState ?? prev.emailContacto,
        dni: perfilState.dni ?? prev.dni,
      }));

      setStep3Data((prev) => ({
        ...prev,
        calle: perfilState.direccion_calle ?? prev.calle,
        numero: perfilState.direccion_numero ?? prev.numero,
        piso: perfilState.direccion_piso ?? prev.piso,
        depto: perfilState.direccion_depto ?? prev.depto,
        ciudad: perfilState.direccion_ciudad ?? prev.ciudad,
        provincia: perfilState.direccion_provincia ?? prev.provincia,
        codigoPostal: perfilState.direccion_codigo_postal ?? prev.codigoPostal,
        referencia: perfilState.direccion_referencia ?? prev.referencia,
        tipoEnvio: perfilState.direccion_calle ? "domicilio" : prev.tipoEnvio,
      }));
    }
  }, [perfilState, userEmailState]);

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    startLoginTransition(async () => {
      const supabase = createBrowserClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      const user = data.user;
      if (user) {
        setUserEmailState(user.email ?? "");
        const { data: profileData } = await supabase
          .from("perfiles")
          .select("*")
          .eq("id", user.id)
          .single();

        setPerfilState(profileData);
        setToastType("success");
        setToastMessage("Sesión iniciada con éxito");
      }
    });
  };

  // Sign out handler
  const handleSignOut = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    setPerfilState(null);
    setUserEmailState("");
    setStep2Data({
      nombreContacto: "",
      apellidoContacto: "",
      whatsappContacto: "",
      emailContacto: "",
      dni: "",
      fechaNacimiento: "",
    });
    setToastType("info");
    setToastMessage("Sesión cerrada");
  };

  // Step validation
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!step2Data.nombreContacto.trim()) newErrors.nombreContacto = "Nombre requerido";
    if (!step2Data.apellidoContacto.trim()) newErrors.apellidoContacto = "Apellido requerido";
    
    const whatsappClean = step2Data.whatsappContacto.trim();
    if (!whatsappClean) {
      newErrors.whatsappContacto = "WhatsApp requerido";
    } else if (whatsappClean.length < 8) {
      newErrors.whatsappContacto = "Mínimo 8 caracteres";
    }

    const emailClean = step2Data.emailContacto.trim();
    if (!emailClean) {
      newErrors.emailContacto = "Email requerido";
    } else if (!/\S+@\S+\.\S+/.test(emailClean)) {
      newErrors.emailContacto = "Email inválido";
    }

    const dniClean = step2Data.dni.trim();
    if (!dniClean) {
      newErrors.dni = "DNI requerido";
    } else if (dniClean.length < 6) {
      newErrors.dni = "Mínimo 6 caracteres";
    }

    setStep2Errors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (step3Data.tipoEnvio === "domicilio") {
      if (!step3Data.calle.trim()) newErrors.calle = "Calle requerida";
      if (!step3Data.numero.trim()) newErrors.numero = "Número requerido";
      if (!step3Data.ciudad.trim()) newErrors.ciudad = "Ciudad requerida";
      if (!step3Data.provincia) newErrors.provincia = "Provincia requerida";
      
      const cpClean = step3Data.codigoPostal.trim();
      if (!cpClean) {
        newErrors.codigoPostal = "Código postal requerido";
      } else if (cpClean.length < 4) {
        newErrors.codigoPostal = "Mínimo 4 caracteres";
      }
    } else if (step3Data.tipoEnvio === "agencia") {
      if (!step3Data.provincia) newErrors.provincia = "Provincia requerida";
      if (!step3Data.ciudad.trim()) newErrors.ciudad = "Ciudad requerida";
    }
    setStep3Errors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step transition handlers
  const handleGoToStep3 = async () => {
    if (validateStep2()) {
      // Proactively update user's profile with Step 2 data if authenticated
      if (perfilState) {
        const supabase = createBrowserClient();
        await supabase.from("perfiles").update({
          nombre_completo: `${step2Data.nombreContacto} ${step2Data.apellidoContacto}`.trim(),
          whatsapp: step2Data.whatsappContacto,
          dni: step2Data.dni,
        }).eq("id", perfilState.id);
      }
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleGoToStep4 = async () => {
    if (validateStep3()) {
      // Proactively update user's profile with Step 3 data if authenticated
      if (perfilState) {
        const supabase = createBrowserClient();
        await supabase.from("perfiles").update({
          direccion_calle: step3Data.calle,
          direccion_numero: step3Data.numero,
          direccion_piso: step3Data.piso,
          direccion_depto: step3Data.depto,
          direccion_ciudad: step3Data.ciudad,
          direccion_provincia: step3Data.provincia,
          direccion_codigo_postal: step3Data.codigoPostal,
          direccion_referencia: step3Data.referencia,
        }).eq("id", perfilState.id);
      }
      setStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!aceptarTerminos) {
      setError("Debés aceptar los términos y condiciones para continuar");
      return;
    }

    const finalFormData = new FormData();
    const fullName = `${step2Data.nombreContacto} ${step2Data.apellidoContacto}`.trim();
    const nombreContactoWithDni = step2Data.dni ? `${fullName} (DNI: ${step2Data.dni})` : fullName;
    finalFormData.append("nombreContacto", nombreContactoWithDni);
    finalFormData.append("whatsappContacto", step2Data.whatsappContacto);
    finalFormData.append("emailContacto", step2Data.emailContacto);
    finalFormData.append("zonaLogisticaId", step3Data.zonaLogisticaId);
    finalFormData.append("tipoEnvio", step3Data.tipoEnvio);
    finalFormData.append("metodoPago", metodoPago);

    if (step3Data.tipoEnvio === "domicilio") {
      finalFormData.append("calle", step3Data.calle);
      finalFormData.append("numero", step3Data.numero);
      finalFormData.append("ciudad", step3Data.ciudad);
      finalFormData.append("codigoPostal", step3Data.codigoPostal);

      const parts = [
        step3Data.alias ? `[${step3Data.alias}]` : "",
        step3Data.piso ? `Piso ${step3Data.piso}` : "",
        step3Data.depto ? `Depto ${step3Data.depto}` : "",
        step3Data.barrio ? `Barrio ${step3Data.barrio}` : "",
        step3Data.referencia ? `${step3Data.referencia}` : "",
      ].filter(Boolean);

      finalFormData.append("referencia", parts.join(", "));
    }

    startTransition(async () => {
      const result = await crearPedidoAction(
        finalFormData,
        toRpcItems(),
        {
          subtotal: pricing.subtotal,
          descuentoAplicado: pricing.descuentoTotal,
          costoEnvio: pricing.costoEnvio,
          total: pricing.total,
        }
      );

      if (!result.success) {
        setError(result.error);
        if ((result as any).isStockCollision || result.error?.includes("reservada por otro")) {
          useCartStore.getState().openCart();
          setTimeout(() => {
            router.push("/carrito");
          }, 2000);
        }
        return;
      }

      clearCart();
      window.location.href = `/checkout/exito/${result.pedidoId}?autoOpen=true`;
    });
  };

  if (!isClient) return null;

  return (
    <div className="space-y-8">
      <CartReservationTimer />
      <CheckoutSteps currentStep={step} />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left main area: Active step content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* STEP 2: TUS DATOS */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              {perfilState ? (
                /* Authenticated User state */
                <Card className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <h2 className="text-lg font-medium text-foreground">Verificá tus datos</h2>
                    <button
                      onClick={handleSignOut}
                      className="text-xs text-primary hover:underline transition-colors"
                      type="button"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                  <p className="text-sm text-muted">
                    Estás comprando como: <span className="font-semibold text-foreground">{perfilState.nombre_completo || userEmailState}</span>
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="nombreContacto">Nombre</Label>
                      <Input
                        id="nombreContacto"
                        value={step2Data.nombreContacto}
                        onChange={(e) => setStep2Data({ ...step2Data, nombreContacto: e.target.value })}
                        className={step2Errors.nombreContacto ? "border-red-500" : ""}
                      />
                      {step2Errors.nombreContacto && (
                        <p className="mt-1 text-xs text-red-500">{step2Errors.nombreContacto}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="apellidoContacto">Apellido</Label>
                      <Input
                        id="apellidoContacto"
                        value={step2Data.apellidoContacto}
                        onChange={(e) => setStep2Data({ ...step2Data, apellidoContacto: e.target.value })}
                        className={step2Errors.apellidoContacto ? "border-red-500" : ""}
                      />
                      {step2Errors.apellidoContacto && (
                        <p className="mt-1 text-xs text-red-500">{step2Errors.apellidoContacto}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="whatsappContacto">WhatsApp</Label>
                      <Input
                        id="whatsappContacto"
                        placeholder="Ej. 3493668308"
                        value={step2Data.whatsappContacto}
                        onChange={(e) => setStep2Data({ ...step2Data, whatsappContacto: e.target.value })}
                        className={step2Errors.whatsappContacto ? "border-red-500" : ""}
                      />
                      {step2Errors.whatsappContacto && (
                        <p className="mt-1 text-xs text-red-500">{step2Errors.whatsappContacto}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="dni">DNI</Label>
                      <Input
                        id="dni"
                        placeholder="Número de documento"
                        value={step2Data.dni}
                        onChange={(e) => setStep2Data({ ...step2Data, dni: e.target.value })}
                        className={step2Errors.dni ? "border-red-500" : ""}
                      />
                      {step2Errors.dni && (
                        <p className="mt-1 text-xs text-red-500">{step2Errors.dni}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleGoToStep3} className="w-full sm:w-auto">
                      Continuar al envío →
                    </Button>
                  </div>
                </Card>
              ) : (
                /* Unauthenticated Guest/Login selection */
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Option A: Login */}
                  <Card className="flex flex-col justify-between">
                    <div>
                      <h2 className="mb-4 text-lg font-medium border-b border-border pb-2 text-foreground">
                        YA SOY MIEMBRO
                      </h2>
                      <div className="mb-4">
                        <GoogleButton label="Ingresar con Google" disabled={true} />
                        <div className="relative my-4 flex items-center justify-center">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                          </div>
                          <span className="relative bg-surface px-2 text-xs uppercase text-muted">o con email</span>
                        </div>
                      </div>
                      <form method="POST" onSubmit={handleLoginSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="login-email">E-mail</Label>
                          <Input
                            id="login-email"
                            name="email"
                            type="email"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="login-password">Contraseña</Label>
                          <PasswordInput
                            id="login-password"
                            name="password"
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full"
                          isLoading={loginPending}
                        >
                          Ingresar
                        </Button>
                      </form>
                    </div>
                    <div className="mt-6 text-center text-xs">
                      <a href="/recuperar" className="text-muted hover:text-foreground transition-colors underline">
                        ¿Olvidaste tu contraseña?
                      </a>
                    </div>
                  </Card>

                  {/* Option B: Guest Form */}
                  <Card className="space-y-4">
                    <h2 className="text-lg font-medium border-b border-border pb-2 text-foreground">
                      COMPRAR COMO INVITADO
                    </h2>
                    <p className="text-xs text-muted">
                      Completá tus datos para continuar con tu compra de forma rápida.
                    </p>

                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="guest-nombre">Nombre</Label>
                          <Input
                            id="guest-nombre"
                            value={step2Data.nombreContacto}
                            onChange={(e) => setStep2Data({ ...step2Data, nombreContacto: e.target.value })}
                            className={step2Errors.nombreContacto ? "border-red-500" : ""}
                          />
                          {step2Errors.nombreContacto && (
                            <p className="mt-1 text-[11px] text-red-500">{step2Errors.nombreContacto}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="guest-apellido">Apellido</Label>
                          <Input
                            id="guest-apellido"
                            value={step2Data.apellidoContacto}
                            onChange={(e) => setStep2Data({ ...step2Data, apellidoContacto: e.target.value })}
                            className={step2Errors.apellidoContacto ? "border-red-500" : ""}
                          />
                          {step2Errors.apellidoContacto && (
                            <p className="mt-1 text-[11px] text-red-500">{step2Errors.apellidoContacto}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="guest-email">E-mail</Label>
                        <Input
                          id="guest-email"
                          type="email"
                          value={step2Data.emailContacto}
                          onChange={(e) => setStep2Data({ ...step2Data, emailContacto: e.target.value })}
                          className={step2Errors.emailContacto ? "border-red-500" : ""}
                        />
                        {step2Errors.emailContacto && (
                          <p className="mt-1 text-[11px] text-red-500">{step2Errors.emailContacto}</p>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label htmlFor="guest-dni">DNI</Label>
                          <Input
                            id="guest-dni"
                            value={step2Data.dni}
                            onChange={(e) => setStep2Data({ ...step2Data, dni: e.target.value })}
                            className={step2Errors.dni ? "border-red-500" : ""}
                          />
                          {step2Errors.dni && (
                            <p className="mt-1 text-[11px] text-red-500">{step2Errors.dni}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="guest-whatsapp">WhatsApp</Label>
                          <Input
                            id="guest-whatsapp"
                            placeholder="Ej. 3493668308"
                            value={step2Data.whatsappContacto}
                            onChange={(e) => setStep2Data({ ...step2Data, whatsappContacto: e.target.value })}
                            className={step2Errors.whatsappContacto ? "border-red-500" : ""}
                          />
                          {step2Errors.whatsappContacto && (
                            <p className="mt-1 text-[11px] text-red-500">{step2Errors.whatsappContacto}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="guest-fnac">Fecha de nacimiento (opcional)</Label>
                        <Input
                          id="guest-fnac"
                          type="date"
                          value={step2Data.fechaNacimiento}
                          onChange={(e) => setStep2Data({ ...step2Data, fechaNacimiento: e.target.value })}
                        />
                      </div>
                    </div>

                    <Button onClick={handleGoToStep3} className="w-full">
                      Continuar al envío →
                    </Button>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: ENVÍO */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <Card className="space-y-5">
                {/* User's Default Saved Address Banner */}
                {perfilState?.direccion_calle && (
                  <div className="rounded-2xl border-2 border-primary/30 bg-primary/[0.03] p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🏠</span>
                        <h3 className="font-semibold text-xs sm:text-sm text-foreground">
                          Dirección predeterminada de tu cuenta
                        </h3>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-arena text-chocolate border border-barro-claro/40">
                        Guardada en tu perfil
                      </span>
                    </div>

                    <p className="text-xs text-muted font-sans leading-snug">
                      <strong>{perfilState.direccion_calle} {perfilState.direccion_numero || ""}</strong>
                      {perfilState.direccion_piso ? `, Piso ${perfilState.direccion_piso}` : ""}
                      {perfilState.direccion_depto ? ` Depto ${perfilState.direccion_depto}` : ""}
                      {` — ${perfilState.direccion_ciudad || ""}, ${perfilState.direccion_provincia || ""}`}
                      {perfilState.direccion_codigo_postal ? ` (CP ${perfilState.direccion_codigo_postal})` : ""}
                    </p>

                    {/* Sunchales Detection */}
                    {(perfilState.direccion_ciudad?.toLowerCase().includes("sunchales") ||
                      perfilState.direccion_provincia?.toLowerCase().includes("sunchales")) && (
                      <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/60 flex flex-wrap items-center justify-between gap-2">
                        <span className="leading-snug">
                          📍 Vemos que estás en <strong>Sunchales</strong>. Podés retirar <strong>GRATIS ($0)</strong> en nuestro taller en Ameghino 1576.
                        </span>
                        <button
                          type="button"
                          onClick={() => setStep3Data({ ...step3Data, tipoEnvio: "taller" })}
                          className="px-3 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shrink-0"
                        >
                          Elegir Retiro en Taller
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => {
                          setStep3Data({
                            ...step3Data,
                            calle: perfilState.direccion_calle ?? "",
                            numero: perfilState.direccion_numero ?? "",
                            piso: perfilState.direccion_piso ?? "",
                            depto: perfilState.direccion_depto ?? "",
                            ciudad: perfilState.direccion_ciudad ?? "",
                            provincia: perfilState.direccion_provincia ?? "",
                            codigoPostal: perfilState.direccion_codigo_postal ?? "",
                            referencia: perfilState.direccion_referencia ?? "",
                          });
                          setToastMessage("Dirección predeterminada cargada en el formulario");
                          setToastType("info");
                        }}
                        className="text-xs"
                      >
                        ✓ Usar esta dirección guardada
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setStep3Data({
                            ...step3Data,
                            calle: "",
                            numero: "",
                            piso: "",
                            depto: "",
                            ciudad: "",
                            provincia: "",
                            codigoPostal: "",
                            referencia: "",
                          });
                          setToastMessage("Campos limpiados para ingresar otra dirección");
                          setToastType("info");
                        }}
                        className="text-xs"
                      >
                        ✍️ Usar otra dirección distinta
                      </Button>
                    </div>
                  </div>
                )}

                {/* Delivery Options Buttons (3 Options) */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => setStep3Data({ ...step3Data, tipoEnvio: "domicilio" })}
                    className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      step3Data.tipoEnvio === "domicilio"
                        ? "border-primary bg-primary/[0.04] shadow-xs"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    <span className="font-semibold text-foreground text-xs sm:text-sm">🏠 A DOMICILIO</span>
                    <span className="mt-1 text-[11px] text-muted leading-snug">
                      Envío a tu casa por Vía Cargo
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep3Data({ ...step3Data, tipoEnvio: "agencia" })}
                    className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      step3Data.tipoEnvio === "agencia"
                        ? "border-primary bg-primary/[0.04] shadow-xs"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    <span className="font-semibold text-foreground text-xs sm:text-sm">📦 SUCURSAL VÍA CARGO</span>
                    <span className="mt-1 text-[11px] text-muted leading-snug">
                      Retirás en agencia de tu localidad
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep3Data({ ...step3Data, tipoEnvio: "taller" })}
                    className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      step3Data.tipoEnvio === "taller"
                        ? "border-primary bg-primary/[0.04] shadow-xs"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    <span className="font-semibold text-foreground text-xs sm:text-sm flex items-center justify-between gap-1">
                      <span>📍 RETIRO EN TALLER</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shrink-0">SIN CARGO</span>
                    </span>
                    <span className="mt-1 text-[11px] text-muted leading-snug">
                      Sunchales, Santa Fe (Ameghino 1576)
                    </span>
                  </button>
                </div>

                {/* Domicilio Form */}
                {step3Data.tipoEnvio === "domicilio" && (
                  <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t border-border/60">
                    <div>
                      <Label htmlFor="alias">Nombre de la dirección / Alias</Label>
                      <Input
                        id="alias"
                        placeholder="Ej. Mi Casa, Oficina"
                        value={step3Data.alias}
                        onChange={(e) => setStep3Data({ ...step3Data, alias: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zonaLogisticaId">Región / Cotización Calculada</Label>
                      <div className="flex h-10 w-full items-center justify-between rounded-md border border-border/80 bg-arena/40 px-3 text-xs font-semibold text-chocolate shadow-sm">
                        <span>{autoShipping.regionNombre}</span>
                        <span className="text-terracota font-serif font-bold text-sm">{formatPrecio(costoEnvio)}</span>
                      </div>
                      <p className="mt-1 text-[10px] text-muted">
                        Calculado automáticamente según tu provincia por proximidad a Sunchales.
                      </p>
                    </div>
                    
                    <div className="sm:col-span-2">
                      <Label htmlFor="calle">Calle</Label>
                      <Input
                        id="calle"
                        value={step3Data.calle}
                        onChange={(e) => setStep3Data({ ...step3Data, calle: e.target.value })}
                        className={step3Errors.calle ? "border-red-500" : ""}
                      />
                      {step3Errors.calle && (
                        <p className="mt-1 text-xs text-red-500">{step3Errors.calle}</p>
                      )}
                    </div>

                    <div className="grid gap-4 grid-cols-3 sm:col-span-2">
                      <div>
                        <Label htmlFor="numero">Número</Label>
                        <Input
                          id="numero"
                          value={step3Data.numero}
                          onChange={(e) => setStep3Data({ ...step3Data, numero: e.target.value })}
                          className={step3Errors.numero ? "border-red-500" : ""}
                        />
                        {step3Errors.numero && (
                          <p className="mt-1 text-xs text-red-500">{step3Errors.numero}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="piso">Piso</Label>
                        <Input
                          id="piso"
                          placeholder="Opcional"
                          value={step3Data.piso}
                          onChange={(e) => setStep3Data({ ...step3Data, piso: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="depto">Depto</Label>
                        <Input
                          id="depto"
                          placeholder="Opcional"
                          value={step3Data.depto}
                          onChange={(e) => setStep3Data({ ...step3Data, depto: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="codigoPostal">Código Postal</Label>
                      <div className="relative">
                        <Input
                          id="codigoPostal"
                          value={step3Data.codigoPostal}
                          onChange={(e) => setStep3Data({ ...step3Data, codigoPostal: e.target.value })}
                          className={step3Errors.codigoPostal ? "border-red-500" : ""}
                        />
                        <a
                          href="https://www.correoargentino.com.ar/formularios/cpa"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-primary hover:underline"
                        >
                          Averiguar CP
                        </a>
                      </div>
                      {step3Errors.codigoPostal && (
                        <p className="mt-1 text-xs text-red-500">{step3Errors.codigoPostal}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="provincia">Provincia</Label>
                      <Select
                        id="provincia"
                        value={step3Data.provincia}
                        onChange={(e) => setStep3Data({ ...step3Data, provincia: e.target.value })}
                        className={step3Errors.provincia ? "border-red-500" : ""}
                      >
                        <option value="">Seleccionar...</option>
                        {PROVINCIAS_ARGENTINAS.map((prov) => (
                          <option key={prov} value={prov}>
                            {prov}
                          </option>
                        ))}
                      </Select>
                      {step3Errors.provincia && (
                        <p className="mt-1 text-xs text-red-500">{step3Errors.provincia}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="ciudad">Ciudad</Label>
                      <Input
                        id="ciudad"
                        value={step3Data.ciudad}
                        onChange={(e) => setStep3Data({ ...step3Data, ciudad: e.target.value })}
                        className={step3Errors.ciudad ? "border-red-500" : ""}
                      />
                      {step3Errors.ciudad && (
                        <p className="mt-1 text-xs text-red-500">{step3Errors.ciudad}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="barrio">Barrio</Label>
                      <Input
                        id="barrio"
                        placeholder="Opcional"
                        value={step3Data.barrio}
                        onChange={(e) => setStep3Data({ ...step3Data, barrio: e.target.value })}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <Label htmlFor="referencia">Referencias / Indicaciones adicionales</Label>
                      <Input
                        id="referencia"
                        placeholder="Ej. Portón negro, entre calles X e Y"
                        value={step3Data.referencia}
                        onChange={(e) => setStep3Data({ ...step3Data, referencia: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Retiro Agencia Form */}
                {step3Data.tipoEnvio === "agencia" && (
                  <div className="pt-4 border-t border-border/60 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="provinciaAgencia">Provincia de Destino</Label>
                        <Select
                          id="provinciaAgencia"
                          value={step3Data.provincia}
                          onChange={(e) => setStep3Data({ ...step3Data, provincia: e.target.value })}
                          className={step3Errors.provincia ? "border-red-500" : ""}
                        >
                          <option value="">Seleccionar provincia...</option>
                          {PROVINCIAS_ARGENTINAS.map((prov) => (
                            <option key={prov} value={prov}>
                              {prov}
                            </option>
                          ))}
                        </Select>
                        {step3Errors.provincia && (
                          <p className="mt-1 text-xs text-red-500">{step3Errors.provincia}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="ciudadAgencia">Ciudad / Localidad</Label>
                        <Input
                          id="ciudadAgencia"
                          placeholder="Ej. Rosario, Bariloche, Córdoba"
                          value={step3Data.ciudad}
                          onChange={(e) => setStep3Data({ ...step3Data, ciudad: e.target.value })}
                          className={step3Errors.ciudad ? "border-red-500" : ""}
                        />
                        {step3Errors.ciudad && (
                          <p className="mt-1 text-xs text-red-500">{step3Errors.ciudad}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label>Cotización Estimada de Retiro en Agencia Vía Cargo</Label>
                      <div className="flex h-10 w-full items-center justify-between rounded-md border border-border/80 bg-arena/40 px-3 text-xs font-semibold text-chocolate shadow-sm">
                        <span>{autoShipping.regionNombre}</span>
                        <span className="text-terracota font-serif font-bold text-sm">{formatPrecio(costoEnvio)}</span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-3.5 text-xs text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700/60 leading-relaxed font-sans font-medium">
                      ℹ️ Retirarás en la sucursal de Vía Cargo de tu localidad o ciudad seleccionada. El punto exacto de retiro se terminará coordinando directamente por WhatsApp con la vendedora.
                    </div>
                  </div>
                )}

                {/* Retiro en Taller Form */}
                {step3Data.tipoEnvio === "taller" && (
                  <div className="pt-4 border-t border-border/60 space-y-4">
                    <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs space-y-2 text-emerald-950 dark:text-emerald-100 shadow-xs">
                      <div className="flex items-center gap-2 font-bold text-sm text-emerald-900 dark:text-emerald-200">
                        <span>📍</span>
                        <span>Dirección del Taller para Retiro Físico</span>
                      </div>
                      <p className="text-xs font-bold text-chocolate dark:text-white">
                        Florentino Ameghino 1576, Sunchales, Santa Fe, Argentina.
                      </p>
                      <p className="text-xs leading-relaxed text-emerald-900/90 dark:text-emerald-200 font-sans font-medium">
                        El retiro es totalmente <strong>SIN CARGO ($0)</strong>. Al confirmar tu pedido, coordinaremos directamente con vos por WhatsApp el día y horario en que pasás a buscar tus piezas por el taller.
                      </p>
                    </div>
                  </div>
                )}

                {/* 🚚 Transport Provider & Mandatory Disclaimer (Vía Cargo) */}
                {step3Data.tipoEnvio !== "taller" && (
                  <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs space-y-2.5 shadow-xs">
                    <div className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-200 text-xs sm:text-sm">
                      <span className="text-base">🚚</span>
                      <span>Empresa de Transporte: Vía Cargo</span>
                    </div>
                    <p className="leading-relaxed font-sans text-xs font-medium text-amber-900 dark:text-amber-200">
                      "Los valores de cotización son únicamente informativos y están sujetos a variaciones según cargo por manejo, peso y/o medidas reales registradas en el momento de la venta. El valor del servicio contraentrega tiene un costo adicional que no está contemplado en esta cotización. El valor del envío puede variar en el momento de la entrega en el punto de venta."
                    </p>
                    <div className="pt-2 border-t border-amber-300 dark:border-amber-700/60 text-xs font-semibold text-amber-950 dark:text-amber-300 space-y-1">
                      <p>• La cotización mostrada es un valor aproximado para tu zona y está a cargo del comprador.</p>
                      <p>• El precio final y punto exacto de despacho se terminará acordando directamente con la vendedora.</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1 sm:flex-initial">
                    ← Volver
                  </Button>
                  <Button onClick={handleGoToStep4} className="flex-1 sm:flex-initial">
                    Continuar al pago →
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* STEP 4: CONFIRMÁ Y PAGÁ */}
          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              {/* Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="space-y-2">
                  <div className="flex justify-between items-center border-b border-border pb-1.5">
                    <span className="text-sm font-semibold text-foreground">Datos de Contacto</span>
                    <button
                      onClick={() => setStep(2)}
                      className="text-xs text-primary hover:underline"
                      type="button"
                    >
                      Modificar
                    </button>
                  </div>
                  <div className="text-xs text-muted space-y-1">
                    <p><span className="font-medium text-foreground">Nombre:</span> {step2Data.nombreContacto} {step2Data.apellidoContacto}</p>
                    <p><span className="font-medium text-foreground">WhatsApp:</span> {step2Data.whatsappContacto}</p>
                    <p><span className="font-medium text-foreground">Email:</span> {step2Data.emailContacto}</p>
                    <p><span className="font-medium text-foreground">DNI:</span> {step2Data.dni}</p>
                  </div>
                </Card>

                <Card className="space-y-2">
                  <div className="flex justify-between items-center border-b border-border pb-1.5">
                    <span className="text-sm font-semibold text-foreground">Entrega</span>
                    <button
                      onClick={() => setStep(3)}
                      className="text-xs text-primary hover:underline"
                      type="button"
                    >
                      Modificar
                    </button>
                  </div>
                  <div className="text-xs text-muted space-y-1">
                    <p><span className="font-medium text-foreground">Tipo:</span> {step3Data.tipoEnvio === "taller" ? "Retiro en Taller (Sin Cargo)" : step3Data.tipoEnvio === "domicilio" ? "A Domicilio (Vía Cargo)" : "Sucursal Vía Cargo"}</p>
                    {step3Data.tipoEnvio === "taller" ? (
                      <p><span className="font-medium text-foreground">Dirección de Retiro:</span> Florentino Ameghino 1576, Sunchales, Santa Fe</p>
                    ) : step3Data.tipoEnvio === "domicilio" ? (
                      <>
                        <p><span className="font-medium text-foreground">Calle:</span> {step3Data.calle} {step3Data.numero} {step3Data.piso ? `, Piso ${step3Data.piso}` : ""} {step3Data.depto ? `, Depto ${step3Data.depto}` : ""}</p>
                        <p><span className="font-medium text-foreground">Ubicación:</span> {step3Data.ciudad}, {step3Data.provincia} ({step3Data.codigoPostal})</p>
                      </>
                    ) : (
                      <p><span className="font-medium text-foreground">Agencia/Zona:</span> {autoShipping.regionNombre}</p>
                    )}
                    {step3Data.tipoEnvio !== "taller" && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium pt-1">
                        🚚 Transporte: Vía Cargo (Costo estimado a cargo del comprador, sujeto a variación por peso/volumen real).
                      </p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Payment Section */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="space-y-5 border-[#25D366]/30 bg-[#25D366]/5">
                  <div className="flex items-center justify-between border-b border-border/80 pb-3">
                    <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                      <WhatsAppIcon className="w-6 h-6 text-[#25D366]" />
                      <span>Coordinación y Pago por WhatsApp</span>
                    </h2>
                  </div>

                  <div className="p-4 rounded-xl bg-white/80 dark:bg-black/30 border border-border/80 text-xs text-muted leading-relaxed space-y-2">
                    <p className="font-semibold text-chocolate text-sm">
                      🏦 Transferencia o Efectivo a la cuenta de la artista
                    </p>
                    <p>
                      Al confirmar el pedido, tus piezas quedarán <strong>reservadas a tu nombre por 48 horas</strong>. La vendedora te enviará el alias bancario por WhatsApp para que realices la transferencia o coordines en efectivo.
                    </p>
                  </div>

                  {/* Terms and conditions checkbox */}
                  <div className="flex items-start gap-2 pt-2 select-none">
                    <input
                      type="checkbox"
                      id="terminos"
                      checked={aceptarTerminos}
                      onChange={(e) => setAceptarTerminos(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/40"
                    />
                    <label htmlFor="terminos" className="text-xs text-muted leading-normal">
                      Acepto los{" "}
                      <button
                        type="button"
                        onClick={() => setTermsOpen(true)}
                        className="text-primary underline hover:text-primary-hover font-medium"
                      >
                        términos y condiciones
                      </button>{" "}
                      de compra.
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setStep(3)} className="flex-1 sm:flex-initial">
                      ← Volver
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 sm:flex-initial bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold shadow-sm"
                      isLoading={pending}
                    >
                      Confirmar Reserva y Coordinar por WhatsApp →
                    </Button>
                  </div>
                </Card>
              </form>
            </div>
          )}

        </div>

        {/* Right column: Resumen del Pedido */}
        <aside className="h-fit">
          <Card className="space-y-5">
            <h2 className="text-lg font-semibold border-b border-border pb-3 text-foreground">
              Resumen de tu compra
            </h2>

            {/* Cart Items List */}
            <ul className="divide-y divide-border/60 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <li key={item.productoId} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex flex-col pr-4">
                    <span className="font-medium text-foreground">{item.nombre}</span>
                    <span className="text-muted text-[10px]">Cantidad: {item.cantidad}</span>
                    {item.personalizado && (
                      <span className="text-primary text-[10px]">★ Personalizado (+15%)</span>
                    )}
                  </div>
                  <span className="font-semibold text-foreground/90 whitespace-nowrap">
                    {formatPrecio(item.precioBase * item.cantidad * (item.personalizado ? 1.15 : 1))}
                  </span>
                </li>
              ))}
            </ul>

            {/* Totals Breakdown */}
            <div className="space-y-2 text-sm border-t border-border pt-4">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>{formatPrecio(pricing.subtotal)}</span>
              </div>
              
              {pricing.descuentoMayorista > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Descuento mayorista</span>
                  <span>-{formatPrecio(pricing.descuentoMayorista)}</span>
                </div>
              )}

              {pricing.descuentoTransferencia > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Transferencia (-20%)</span>
                  <span>-{formatPrecio(pricing.descuentoTransferencia)}</span>
                </div>
              )}

              <div className="flex justify-between text-muted">
                <span>Costo de envío</span>
                <span>
                  {step >= 3 ? formatPrecio(costoEnvio) : <span className="italic text-[11px]">(Se calcula en Paso 3)</span>}
                </span>
              </div>

              <div className="flex justify-between border-t border-border pt-3.5 text-base font-semibold text-foreground">
                <span>Total</span>
                <span>{formatPrecio(pricing.total)}</span>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Terms and Conditions Modal */}
      <TerminosModal open={termsOpen} onClose={() => setTermsOpen(false)} />
    </div>
  );
}
