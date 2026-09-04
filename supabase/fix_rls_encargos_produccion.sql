-- ==============================================================================
-- CORRECCIÓN DE POLÍTICAS RLS PARA TABLAS DE ENCARGOS EN PRODUCCIÓN Y TEST
-- Permite que los visitantes y clientes registren solicitudes de encargos
-- ==============================================================================

-- 1. Habilitar RLS en la tabla encargos (por seguridad)
ALTER TABLE public.encargos ENABLE ROW LEVEL SECURITY;

-- 2. Asegurar que cualquier usuario (anónimo o autenticado) pueda insertar una solicitud de encargo
DROP POLICY IF EXISTS "encargos_insert_public" ON public.encargos;
CREATE POLICY "encargos_insert_public" 
  ON public.encargos 
  FOR INSERT 
  TO public 
  WITH CHECK (TRUE);

-- 3. Asegurar que los usuarios autenticados puedan ver sus propios encargos
DROP POLICY IF EXISTS "encargos_select_own" ON public.encargos;
CREATE POLICY "encargos_select_own" 
  ON public.encargos 
  FOR SELECT 
  TO public 
  USING (
    usuario_id = auth.uid() 
    OR 
    email_contacto = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR 
    public.is_admin()
  );

-- 4. Habilitar RLS en items_encargo y permitir inserción y lectura
ALTER TABLE public.items_encargo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "items_encargo_insert_public" ON public.items_encargo;
CREATE POLICY "items_encargo_insert_public" 
  ON public.items_encargo 
  FOR INSERT 
  TO public 
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "items_encargo_select_public" ON public.items_encargo;
CREATE POLICY "items_encargo_select_public" 
  ON public.items_encargo 
  FOR SELECT 
  TO public 
  USING (TRUE);
