-- ==============================================================================
-- Migration: Añadir usuario_id a la tabla encargos y asociar clientes existentes
-- ==============================================================================

-- 1. Añadir la columna usuario_id con foreign key a auth.users
ALTER TABLE public.encargos
  ADD COLUMN IF NOT EXISTS usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Crear índice para optimizar consultas de encargos por usuario
CREATE INDEX IF NOT EXISTS idx_encargos_usuario_id ON public.encargos(usuario_id);

-- 3. (Opcional) Vincular automáticamente los encargos anteriores que coincidan con el email del usuario
UPDATE public.encargos e
SET usuario_id = u.id
FROM auth.users u
WHERE e.usuario_id IS NULL
  AND e.email_contacto IS NOT NULL
  AND LOWER(e.email_contacto) = LOWER(u.email);

-- 4. Habilitar política RLS para que los usuarios puedan ver sus propios encargos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'encargos' 
    AND policyname = 'Los usuarios pueden ver sus propios encargos'
  ) THEN
    CREATE POLICY "Los usuarios pueden ver sus propios encargos"
      ON public.encargos
      FOR SELECT
      TO authenticated
      USING (
        auth.uid() = usuario_id 
        OR LOWER(auth.jwt() ->> 'email') = LOWER(email_contacto)
      );
  END IF;
END $$;
