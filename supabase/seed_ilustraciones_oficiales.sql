-- ==============================================================================
-- MILIDEAS ARTE - SEED OFICIAL DEL CATÁLOGO DE ILUSTRACIONES PERSONALIZADAS
-- Fuente: Documento Oficial de Precios & Presupuestos (PDF Mili Ferrero)
-- ==============================================================================

-- 1. Insertar formatos base en formatos_catalogo para el catálogo de Ilustración
INSERT INTO public.formatos_catalogo (rubro, categoria, nombre, medidas, precio_base, orden, activo) VALUES
  (
    'ilustracion',
    'Cuadro Box con Vidrio',
    'Ilustración Personalizada 10 x 15 cm',
    '10 x 15 cm (Papel 300g · Marco pino box con vidrio)',
    57000,
    1,
    TRUE
  ),
  (
    'ilustracion',
    'Cuadro Box con Vidrio',
    'Ilustración Personalizada 13 x 18 cm',
    '13 x 18 cm (Papel 300g · Marco pino box con vidrio)',
    67000,
    2,
    TRUE
  ),
  (
    'ilustracion',
    'Cuadro Box con Vidrio',
    'Ilustración Personalizada 15 x 21 cm',
    '15 x 21 cm (Papel 300g · Marco pino box con vidrio)',
    77000,
    3,
    TRUE
  ),
  (
    'ilustracion',
    'Cuadro Box con Vidrio',
    'Ilustración Personalizada 20 x 25 cm',
    '20 x 25 cm (Papel 300g · Marco pino box con vidrio)',
    87000,
    4,
    TRUE
  ),
  (
    'ilustracion',
    'Cuadro Box con Vidrio',
    'Ilustración Personalizada 30 x 40 cm',
    '30 x 40 cm (Papel 300g · Marco pino box con vidrio)',
    105000,
    5,
    TRUE
  )
ON CONFLICT DO NOTHING;

-- 2. Actualizar la configuración general del módulo de encargos de ilustraciones
UPDATE public.configuracion_encargos
SET
  medidas_ilustraciones = '[
    {"id": "10x15", "nombre": "10 x 15 cm (Marco pino box con vidrio)", "precio_simple": 57000, "precio_complejo": 65550, "recargo": 0},
    {"id": "13x18", "nombre": "13 x 18 cm (Marco pino box con vidrio)", "precio_simple": 67000, "precio_complejo": 77050, "recargo": 10000},
    {"id": "15x21", "nombre": "15 x 21 cm (Marco pino box con vidrio)", "precio_simple": 77000, "precio_complejo": 88550, "recargo": 20000},
    {"id": "20x25", "nombre": "20 x 25 cm (Marco pino box con vidrio)", "precio_simple": 87000, "precio_complejo": 100050, "recargo": 30000},
    {"id": "30x40", "nombre": "30 x 40 cm (Marco pino box con vidrio)", "precio_simple": 105000, "precio_complejo": 120750, "recargo": 48000}
  ]'::jsonb,
  porcentaje_recargo_personalizado = 0.15, -- 15% para ilustración compleja (hasta 5 personajes / fondo detallado)
  demora_default_dias = 21, -- Entre 2 y 3 semanas según demanda
  updated_at = NOW()
WHERE id = 'e2000000-0000-4000-8000-000000000001';

-- Notificar a PostgREST para refrescar el schema cache
NOTIFY pgrst, 'reload schema';
