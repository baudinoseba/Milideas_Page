-- ==========================================
-- SCRIPT DE CORRECCIÓN DE REGISTRO EN SUPABASE
-- Ejecutar este script en el Editor SQL de Supabase (SQL Editor)
-- para restaurar el registro de usuarios y mantener el acceso admin.
-- ==========================================

-- 1. Eliminar el trigger de actualización en auth.users
-- (Este trigger causaba el error 500 al interferir con las escrituras de sesión de Supabase Auth)
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP FUNCTION IF EXISTS public.handle_update_user();

-- 2. Revertir la función de creación de perfiles a su estado original seguro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.perfiles (id, nombre_completo, whatsapp)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nombre_completo', NEW.email),
    NEW.raw_user_meta_data ->> 'whatsapp'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3. Asegurar el trigger de creación de perfil al registrarse
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Mantener la política de RLS para inserciones directas como fallback
DROP POLICY IF EXISTS "perfiles_insert_own" ON public.perfiles;
CREATE POLICY "perfiles_insert_own" ON public.perfiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
