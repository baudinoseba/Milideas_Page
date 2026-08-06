# Operación — Milideas E-commerce

## Crear un Drop

1. Ingresá a `/admin` con una cuenta `es_admin = true`.
2. Andá a **Productos → Nuevo producto** (o editá uno existente).
3. Completá los datos del producto y asigná **Fecha de lanzamiento**.
4. Activá el toggle **Activo (Drop visible)**.
5. Guardá. El producto aparecerá en `/drops` si la fecha está dentro de los últimos 30 días.

## Gestionar pedidos

1. En **Admin → Pedidos** verás los pedidos con estado `pendiente_pago`.
2. Los pedidos con menos de 24h restantes se marcan como **Por vencer**.
3. Al recibir el comprobante:
   - Abrí el detalle del pedido.
   - Verificá el comprobante adjunto.
   - Click en **Confirmar pago** → estado pasa a `confirmado` (el stock ya fue reservado en checkout).
4. Si el pago no se acredita dentro del plazo:
   - Click en **Cancelar pedido** → el stock se restaura automáticamente.

## Reserva de stock

- El stock se decrementa **atómicamente** al confirmar el checkout (RPC `crear_pedido`).
- En lanzamientos con piezas únicas, solo el primer checkout exitoso reserva la pieza.
- Los demás reciben: *"Esta pieza acaba de ser reservada por otro comprador"*.

## Variables de entorno

Copiá `.env.example` a `.env.local` y completá las credenciales de Supabase.

## Migraciones

```bash
supabase db push
supabase db execute --file supabase/seed.sql
```

## Despliegue (Vercel)

1. Conectá el repositorio a Vercel.
2. Configurá las variables de `NEXT_PUBLIC_*` en el dashboard.
3. El dominio custom y SSL se gestionan desde Vercel → Settings → Domains.
