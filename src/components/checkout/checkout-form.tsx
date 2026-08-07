"use client";

import { useEffect, useState, useTransition, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Toast } from "@/components/ui/modal";
import { formatPrecio } from "@/lib/pricing";
import { calcularCostoEnvio } from "@/lib/shipping";
import { crearPedidoAction, loginAction } from "@/lib/actions";
import { useCartStore } from "@/stores/cart-store";
import { CheckoutSteps } from "@/components/checkout/checkout-steps";
import { TerminosModal } from "@/components/checkout/terminos-modal";
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

  // Dynamic calculations
  const zona = zonas.find((z) => z.id === step3Data.zonaLogisticaId);
  const costoEnvio = zona ? calcularCostoEnvio(zona, step3Data.tipoEnvio) : 0;
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
        return;
      }

      clearCart();
      router.push(`/checkout/exito/${result.pedidoId}`);
    });
  };

  if (!isClient) return null;

  return (
    <div className="space-y-8">
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
                      <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                          <Input
                            id="login-password"
                            name="password"
                            type="password"
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
                <h2 className="text-lg font-medium border-b border-border pb-2 text-foreground">
                  Opción de entrega
                </h2>

                {/* Delivery Options Buttons */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setStep3Data({ ...step3Data, tipoEnvio: "domicilio" })}
                    className={`flex flex-col text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                      step3Data.tipoEnvio === "domicilio"
                        ? "border-primary bg-primary/[0.02]"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    <span className="font-semibold text-foreground">A DOMICILIO</span>
                    <span className="mt-1 text-xs text-muted">
                      Entregamos en el domicilio que nos indiques
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep3Data({ ...step3Data, tipoEnvio: "agencia" })}
                    className={`flex flex-col text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                      step3Data.tipoEnvio === "agencia"
                        ? "border-primary bg-primary/[0.02]"
                        : "border-border hover:border-border/80"
                    }`}
                  >
                    <span className="font-semibold text-foreground">RETIRO EN AGENCIA / TIENDA</span>
                    <span className="mt-1 text-xs text-muted">
                      Podés retirar en la sucursal de correo más cercana
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
                      <Label htmlFor="zonaLogisticaId">Región / Zona de Envío</Label>
                      <Select
                        id="zonaLogisticaId"
                        value={step3Data.zonaLogisticaId}
                        onChange={(e) => setStep3Data({ ...step3Data, zonaLogisticaId: e.target.value })}
                        required
                      >
                        {zonas.filter(z => z.precio_domicilio > 0).map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.zona_nombre} ({formatPrecio(z.precio_domicilio)})
                          </option>
                        ))}
                      </Select>
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
                    <div>
                      <Label htmlFor="agenciaZona">Agencia / Punto de Retiro</Label>
                      <Select
                        id="agenciaZona"
                        value={step3Data.zonaLogisticaId}
                        onChange={(e) => setStep3Data({ ...step3Data, zonaLogisticaId: e.target.value })}
                        required
                      >
                        {zonas.filter(z => z.precio_agencia > 0).map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.zona_nombre} ({formatPrecio(z.precio_agencia)})
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="rounded-lg bg-secondary/30 p-3 text-xs text-muted select-none border border-border/60">
                      ℹ️ Retirarás en la sucursal de correo de la zona seleccionada. Se te notificará por WhatsApp/Email cuando esté listo para retiro.
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
                    <p><span className="font-medium text-foreground">Tipo:</span> {step3Data.tipoEnvio === "domicilio" ? "A Domicilio" : "Retiro en Agencia"}</p>
                    {step3Data.tipoEnvio === "domicilio" ? (
                      <>
                        <p><span className="font-medium text-foreground">Calle:</span> {step3Data.calle} {step3Data.numero} {step3Data.piso ? `, Piso ${step3Data.piso}` : ""} {step3Data.depto ? `, Depto ${step3Data.depto}` : ""}</p>
                        <p><span className="font-medium text-foreground">Ubicación:</span> {step3Data.ciudad}, {step3Data.provincia} ({step3Data.codigoPostal})</p>
                      </>
                    ) : (
                      <p><span className="font-medium text-foreground">Agencia/Zona:</span> {zona?.zona_nombre}</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Payment Section */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <Card className="space-y-5">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h2 className="text-lg font-medium text-foreground">
                      Información de pago
                    </h2>
                    <svg className="w-5 h-5 text-[#25D366] fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.729-1.452L0 24zm6.59-4.846c1.6.95 3.197 1.451 4.811 1.452 5.518 0 10.006-4.486 10.01-10.002.002-2.673-1.03-5.184-2.906-7.06C16.634 1.66 14.12 1.61 11.45 1.61 6.435 1.61 1.95 6.096 1.947 11.61c0 1.696.442 3.352 1.28 4.8l-.996 3.636 3.823-.992zm11.084-7.472c-.3-.149-1.772-.875-2.046-.975-.276-.1-.476-.15-.676.15-.2.3-.775.975-.95 1.174-.175.2-.35.225-.65.075-3.037-1.512-4.662-2.686-5.88-4.781-.313-.537-.038-.828.188-1.127.202-.27.45-.525.675-.787.225-.262.3-.45.45-.75.15-.3.075-.562-.037-.812-.113-.25-.95-2.288-1.3-3.125-.342-.826-.688-.713-.95-.713-.244-.006-.525-.006-.806-.006-.28 0-.737.106-1.125.525-.387.419-1.475 1.438-1.475 3.506 0 2.069 1.506 4.069 1.712 4.344.207.275 2.969 4.532 7.194 6.356 1.006.431 1.794.688 2.406.881 1.013.325 1.931.281 2.656.175.806-.119 1.775-.725 2.025-1.388.25-.662.25-1.238.175-1.387-.075-.15-.275-.25-.575-.4z" />
                    </svg>
                  </div>

                  <div className="p-4 rounded-lg bg-secondary/15 border border-border/80 text-xs text-muted leading-relaxed space-y-1">
                    <p className="font-semibold text-foreground text-sm">Acordamos el pago por WhatsApp</p>
                    <p>Acordamos el pago y coste de envío vía WhatsApp.</p>
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
                    <Button type="submit" className="flex-1 sm:flex-initial" isLoading={pending}>
                      Confirmar pedido
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
