-- Seed data for development
INSERT INTO public.categorias (id, nombre) VALUES
  ('a1000000-0000-4000-8000-000000000001', 'Tazas'),
  ('a1000000-0000-4000-8000-000000000002', 'Platos'),
  ('a1000000-0000-4000-8000-000000000003', 'Decoración')
ON CONFLICT DO NOTHING;

INSERT INTO public.configuracion_logistica (id, zona_nombre, precio_agencia, precio_domicilio, activa) VALUES
  ('b1000000-0000-4000-8000-000000000001', 'CABA', 4500, 6500, TRUE),
  ('b1000000-0000-4000-8000-000000000002', 'GBA Norte', 5500, 7500, TRUE),
  ('b1000000-0000-4000-8000-000000000003', 'Interior', 8000, 12000, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO public.productos (
  id, categoria_id, nombre, slug, descripcion, precio_base,
  es_personalizable, stock_disponible, es_entrega_inmediata,
  fecha_lanzamiento, activo
) VALUES
  (
    'c1000000-0000-4000-8000-000000000001',
    'a1000000-0000-4000-8000-000000000001',
    'Taza Aurora',
    'taza-aurora',
    'Taza de cerámica esmaltada a mano con degradado suave.',
    18500,
    TRUE,
    1,
    FALSE,
    NOW() - INTERVAL '2 days',
    TRUE
  ),
  (
    'c1000000-0000-4000-8000-000000000002',
    'a1000000-0000-4000-8000-000000000002',
    'Plato Luna',
    'plato-luna',
    'Plato decorativo con textura orgánica.',
    22000,
    FALSE,
    3,
    TRUE,
    NOW() - INTERVAL '5 days',
    TRUE
  ),
  (
    'c1000000-0000-4000-8000-000000000003',
    'a1000000-0000-4000-8000-000000000003',
    'Jarrón Niebla',
    'jarron-niebla',
    'Pieza única del drop de enero.',
    45000,
    TRUE,
    1,
    FALSE,
    NOW(),
    TRUE
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.producto_imagenes (producto_id, url_imagen, orden) VALUES
  ('c1000000-0000-4000-8000-000000000001', 'https://placehold.co/800x800/f5f5f4/1c1917?text=Taza+Aurora', 0),
  ('c1000000-0000-4000-8000-000000000002', 'https://placehold.co/800x800/f5f5f4/1c1917?text=Plato+Luna', 0),
  ('c1000000-0000-4000-8000-000000000003', 'https://placehold.co/800x800/f5f5f4/1c1917?text=Jarron+Niebla', 0)
ON CONFLICT DO NOTHING;
