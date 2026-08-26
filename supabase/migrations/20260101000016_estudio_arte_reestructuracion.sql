-- Migration: Reestructuración Integral Estudio de Arte Milideas
-- Soporta: Formatos Base de Catálogo, Portfolio de Colecciones, Obras & Proyectos Especiales

-- 1. Tabla de Formatos Base del Catálogo (Mates, Cuencos, Bandejas, etc.)
CREATE TABLE IF NOT EXISTS public.formatos_catalogo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubro TEXT NOT NULL DEFAULT 'ceramica' CHECK (rubro IN ('ceramica', 'ilustracion')),
  nombre TEXT NOT NULL,
  categoria TEXT,
  medidas TEXT,
  precio_base NUMERIC(12, 2) NOT NULL DEFAULT 0,
  foto_url TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla de Portfolio de Colecciones (Colecciones históricas/carruseles para inspiración)
CREATE TABLE IF NOT EXISTS public.portfolio_colecciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubro TEXT NOT NULL DEFAULT 'ceramica' CHECK (rubro IN ('ceramica', 'ilustracion')),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  portada_url TEXT,
  fotos JSONB NOT NULL DEFAULT '[]'::jsonb,
  disenos_disponibles JSONB NOT NULL DEFAULT '[]'::jsonb,
  orden INTEGER NOT NULL DEFAULT 0,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabla de Obras & Proyectos Especiales (Murales, Esculturas Mascotas, Packaging, B2B)
CREATE TABLE IF NOT EXISTS public.obras_proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL CHECK (categoria IN ('murales', 'esculturas', 'ilustraciones', 'gran_dimension_b2b', 'miniaturas')),
  titulo TEXT NOT NULL,
  subtitulo TEXT,
  descripcion TEXT,
  cliente_lugar TEXT,
  portada_url TEXT,
  fotos JSONB NOT NULL DEFAULT '[]'::jsonb,
  destacado_home BOOLEAN NOT NULL DEFAULT FALSE,
  orden INTEGER NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Habilitar RLS
ALTER TABLE public.formatos_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_colecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obras_proyectos ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura pública
DROP POLICY IF EXISTS "Lectura pública de formatos_catalogo" ON public.formatos_catalogo;
CREATE POLICY "Lectura pública de formatos_catalogo" ON public.formatos_catalogo FOR SELECT TO public USING (activo = true);

DROP POLICY IF EXISTS "Lectura pública de portfolio_colecciones" ON public.portfolio_colecciones;
CREATE POLICY "Lectura pública de portfolio_colecciones" ON public.portfolio_colecciones FOR SELECT TO public USING (activa = true);

DROP POLICY IF EXISTS "Lectura pública de obras_proyectos" ON public.obras_proyectos;
CREATE POLICY "Lectura pública de obras_proyectos" ON public.obras_proyectos FOR SELECT TO public USING (activo = true);

-- Políticas de escritura para administradores
DROP POLICY IF EXISTS "Admin total en formatos_catalogo" ON public.formatos_catalogo;
CREATE POLICY "Admin total en formatos_catalogo" ON public.formatos_catalogo FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.perfiles WHERE perfiles.id = auth.uid() AND perfiles.es_admin = true)
);

DROP POLICY IF EXISTS "Admin total en portfolio_colecciones" ON public.portfolio_colecciones;
CREATE POLICY "Admin total en portfolio_colecciones" ON public.portfolio_colecciones FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.perfiles WHERE perfiles.id = auth.uid() AND perfiles.es_admin = true)
);

DROP POLICY IF EXISTS "Admin total en obras_proyectos" ON public.obras_proyectos;
CREATE POLICY "Admin total en obras_proyectos" ON public.obras_proyectos FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.perfiles WHERE perfiles.id = auth.uid() AND perfiles.es_admin = true)
);

-- 5. Seed inicial del Catálogo Oficial de Cerámica (según PDF)
INSERT INTO public.formatos_catalogo (rubro, categoria, nombre, medidas, precio_base, orden) VALUES
  ('ceramica', 'Mates', 'Mate Chico', 'forma a elección', 20625, 1),
  ('ceramica', 'Mates', 'Mate Común con Manija', 'con manija', 24375, 2),
  ('ceramica', 'Mates', 'Mate Común', 'forma a elección', 23125, 3),
  ('ceramica', 'Cuencos', 'Cuenco Mini', '8 cm x 4 cm', 11875, 4),
  ('ceramica', 'Cuencos', 'Cuenco Chico', '13 cm x 6 cm', 19125, 5),
  ('ceramica', 'Cuencos', 'Cuenco Mediano', '16 x 9 cm', 27500, 6),
  ('ceramica', 'Cuencos', 'Cazuela Mediana', '14 x 7 cm', 20625, 7),
  ('ceramica', 'Ensaladeras', 'Ensaladera Grande Alta', '23 x 16 cm', 48125, 8),
  ('ceramica', 'Ensaladeras', 'Ensaladera Mediana Baja', '19 x 8 cm', 44000, 9),
  ('ceramica', 'Cuencos', 'Cuenco Cónico', '25 x 16 cm', 34750, 10),
  ('ceramica', 'Cuencos', 'Cuenco Playo (tipo plato hondo)', '17 x 6 cm', 25625, 11),
  ('ceramica', 'Ensaladeras', 'Ensaladera Grande Playa (tipo frutera)', '24 x 8 cm', 49375, 12),
  ('ceramica', 'Platos', 'Plato Grande', '28 cm diám', 36875, 13),
  ('ceramica', 'Platos', 'Plato Cuadrado', '17 x 17 cm', 25625, 14),
  ('ceramica', 'Platos', 'Plato Mediano', '19 cm diám', 23500, 15),
  ('ceramica', 'Platos', 'Plato Corazón', '15 x 16 cm', 21875, 16),
  ('ceramica', 'Platos', 'Plato Tostada', '14 x 11 cm', 19375, 17),
  ('ceramica', 'Platos', 'Plato Chico', '15 cm diám', 20625, 18),
  ('ceramica', 'Platos', 'Plato de Té', '11 cm diám', 13125, 19),
  ('ceramica', 'Bandejas', 'Bandeja Grande', '30 x 16 cm', 43125, 20),
  ('ceramica', 'Bandejas', 'Bandeja Mediana', 'varios modelos', 26875, 21),
  ('ceramica', 'Bandejas', 'Bandeja Mediana Oval', '21 x 14 cm', 25625, 22),
  ('ceramica', 'Tazas y Tazones', 'Taza Chica de Té', 'forma a elección', 20625, 23),
  ('ceramica', 'Tazas y Tazones', 'Pocillo de Café', 'forma a elección', 18125, 24),
  ('ceramica', 'Tazas y Tazones', 'Taza Mediana', '10 x 8 cm', 24750, 25),
  ('ceramica', 'Tazas y Tazones', 'Tazón XXL', '13 x 9 cm', 30625, 26),
  ('ceramica', 'Tazas y Tazones', 'Tazón XXL con Base', '14 x 9 cm', 30625, 27),
  ('ceramica', 'Mesa y Té', 'Azucarera Chica', 'formas varias', 24750, 28),
  ('ceramica', 'Mesa y Té', 'Azucarera Grande', 'formas varias', 27250, 29),
  ('ceramica', 'Mesa y Té', 'Frasco Chico', '19 x 15 cm', 35625, 30),
  ('ceramica', 'Mesa y Té', 'Frasco Grande', '30 x 18 cm', 48250, 31),
  ('ceramica', 'Mesa y Té', 'Té para Uno', '30 x 20 cm', 48125, 32),
  ('ceramica', 'Mesa y Té', 'Tetera', '500 ml', 33750, 33),
  ('ceramica', 'Mesa y Té', 'Jarra Grande', '2 litros (20 x 19 cm)', 48125, 34),
  ('ceramica', 'Mesa y Té', 'Jarra Mediana', '800 ml (14 x 10 cm)', 34375, 35),
  ('ceramica', 'Hogar y Deco', 'Contenedor Chico', '15 x 10 cm', 23500, 36),
  ('ceramica', 'Hogar y Deco', 'Contenedor Grande', '25 x 15 cm', 36875, 37),
  ('ceramica', 'Hogar y Deco', 'Maceta Grande', 'forma a elección', 28250, 38),
  ('ceramica', 'Hogar y Deco', 'Maceta Chica', 'tipo mate', 23250, 39),
  ('ceramica', 'Hogar y Deco', 'Floreros Medianos', '15 x 8 cm', 25625, 40),
  ('ceramica', 'Hogar y Deco', 'Floreros Grandes', '25 x 15 cm', 36750, 41),
  ('ceramica', 'Hogar y Deco', 'Hornitos', '13 x 7 cm', 23500, 42),
  ('ceramica', 'Mesa y Té', 'Mantequeras', '19 x 12 cm', 33125, 43),
  ('ceramica', 'Hogar y Deco', 'Portasahumerios', 'formas varias', 19375, 44),
  ('ceramica', 'Hogar y Deco', 'Alhajeritos', 'formas varias', 19375, 45)
ON CONFLICT DO NOTHING;

-- Seed inicial de Formatos de Ilustración
INSERT INTO public.formatos_catalogo (rubro, categoria, nombre, medidas, precio_base, orden) VALUES
  ('ilustracion', 'Láminas', 'Lámina A4 en Papel Texturado', '21 x 30 cm', 12000, 1),
  ('ilustracion', 'Láminas', 'Lámina A3 en Papel Texturado', '30 x 42 cm', 18500, 2),
  ('ilustracion', 'Láminas', 'Lámina Gran Formato', '50 x 70 cm', 28000, 3),
  ('ilustracion', 'Cuadros', 'Cuadro Enmarcado con Vidrio A4', '21 x 30 cm + marco', 22500, 4),
  ('ilustracion', 'Cuadros', 'Cuadro Enmarcado con Vidrio A3', '30 x 42 cm + marco', 32000, 5),
  ('ilustracion', 'Coleccionables', 'Pack de Stickers Ilustrados', 'Pack x 5 unidades', 6500, 6)
ON CONFLICT DO NOTHING;

-- Seed inicial de Portfolio de Colecciones
INSERT INTO public.portfolio_colecciones (rubro, nombre, descripcion, disenos_disponibles, orden) VALUES
  ('ceramica', 'Colección Argentina de mi Corazón', 'Inspirada en paisajes, animales autóctonos y calidez argentina.', '["Sol Sonriente", "Ballena Franca", "Montañas y Campo", "Flores Silvestres"]'::jsonb, 1),
  ('ceramica', 'Colección Botánica & Jardín', 'Composiciones florales delicadas, hojas y colores tierra.', '["Flores Botánicas", "Hojas de Otoño", "Lavandas", "Jardín Secreto"]'::jsonb, 2),
  ('ceramica', 'Colección Amigos Animales', 'Animalitos tiernos modelados y pintados con detalles únicos.', '["Ardillita de Bosque", "Conejo Floral", "Pajarito Cantador", "Gatito Curioso"]'::jsonb, 3),
  ('ilustracion', 'Serie Acuarelas & Naturaleza', 'Ilustraciones originales en acuarela y tinta sobre papel de algodón.', '["Flora Autóctona", "Aves del Litoral", "Cielo Estrellado"]'::jsonb, 1)
ON CONFLICT DO NOTHING;

-- Seed inicial de Obras & Proyectos Especiales
INSERT INTO public.obras_proyectos (categoria, titulo, subtitulo, descripcion, cliente_lugar, destacado_home, orden) VALUES
  ('murales', 'Vidriera Ilustrada & Mural Comercial', 'Pintura a mano alzada sobre cristal y muros', 'Diseño y realización de vidriera y mural interior personalizado con motivos alegres y veraniegos.', 'Heladería Artesanal, Santa Fe', true, 1),
  ('murales', 'Mural Residencial Botánico', 'Intervención artística en pared interior', 'Mural de gran escala pintado directamente sobre pared con paleta cálida y orgánica.', 'Residencia Privada, Sunchales', true, 2),
  ('esculturas', 'Esculturas Personalizadas de Mascotas', 'Modelado tridimensional en cerámica gres', 'Retratos escultóricos modelados a partir de fotografías de mascotas con acabado vidriado.', 'Encargos Particulares', true, 3),
  ('gran_dimension_b2b', 'Vajilla de Autor para Gastronomía', 'Lote exclusivo de piezas únicas', 'Desarrollo de piezas exclusivas para presentación de platos y ambientación gastronómica.', 'Restaurante & Café de Especialidad', true, 4)
ON CONFLICT DO NOTHING;
