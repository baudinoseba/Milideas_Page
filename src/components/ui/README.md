# Componentes UI — Milideas

Biblioteca Ghost UI mobile-first. Primitivos en `src/components/ui/`.

## Uso

```tsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
```

## Principios

- Fondos neutros (`background`, `surface`)
- Color solo en imágenes de producto y badges semánticos
- `min-h-11` en controles táctiles
- `OptimizedImage` envuelve `next/image` con sizes responsive
