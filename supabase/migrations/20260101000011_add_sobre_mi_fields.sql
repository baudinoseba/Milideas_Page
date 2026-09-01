-- Migration: Add sobre_mi fields to configuracion_sitio
ALTER TABLE public.configuracion_sitio
  ADD COLUMN IF NOT EXISTS sobre_mi_foto_url TEXT,
  ADD COLUMN IF NOT EXISTS sobre_mi_titulo TEXT DEFAULT 'Mili Ferrero',
  ADD COLUMN IF NOT EXISTS sobre_mi_frase TEXT DEFAULT 'Cada pieza tiene alma propia y provoca una sonrisa.',
  ADD COLUMN IF NOT EXISTS sobre_mi_texto TEXT DEFAULT '¡Hola! Soy Mili Ferrero. Desde mi taller en Sunchales, Santa Fe, doy vida a objetos de diseño, cerámica artesanal y obras pictóricas originales.

Cada taza, escultura, mural o dibujo nace de un proceso pausado y respetuoso de los tiempos del material: modelado a mano, secado natural, horneadas a 1080°C y pinceladas llenas de calidez botánica y animal.

Creo en el valor de lo auténtico: piezas que no salen de una máquina, sino de manos dedicadas a transformar tus momentos cotidianos en pequeños rituales de disfrute.',
  ADD COLUMN IF NOT EXISTS sobre_mi_foto_pos_x NUMERIC DEFAULT 50,
  ADD COLUMN IF NOT EXISTS sobre_mi_foto_pos_y NUMERIC DEFAULT 50,
  ADD COLUMN IF NOT EXISTS sobre_mi_foto_zoom NUMERIC DEFAULT 100,
  ADD COLUMN IF NOT EXISTS sobre_mi_foto_fit TEXT DEFAULT 'cover';
