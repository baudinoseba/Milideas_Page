# Minuta de Reunión con la Artista & Redefinición de Estructura de Milideas

## 1. Contexto y Filosofía de Trabajo
- **Cliente / Artista**: Negocio de autor, trato flexible y sin plazos rígidos de entrega.
- **Objetivo**: Alinear la plataforma 100% al flujo de trabajo real de la artista tras ver la primera versión funcional.
- **Regla de oro actual**: No modificar código aún. Mantener un diálogo iterativo para pulir el plan de trabajo al detalle.

---

## 2. Redefinición de Navegación Principal

Se simplifican las secciones principales de la tienda a dos grandes pilares de trabajo activo:
1. **Cerámica**
2. **Ilustración**
*(Se elimina temporalmente la sección de Esculturas del menú principal)*.

Ambas secciones compartirán una arquitectura de componentes y lógica idéntica, parametrizada según el rubro.

---

## 3. Arquitectura Interna de Cada Sección (Cerámica e Ilustración)

Dentro de cada sección (Cerámica / Ilustración), la experiencia se divide en 3 módulos clave:

```
                  ┌──────────────────────────────┐
                  │          CERÁMICA            │
                  │       (o ILUSTRACIÓN)        │
                  └──────────────┬───────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│ 1. STOCK         │   │ 2. CATÁLOGO       │   │ 3. PORTFOLIO      │
│ (Entrega inmedi.)│   │ (Formatos base    │   │ (Colecciones      │
│ - Drops mensuales│   │  para encargo)    │   │  anteriores y     │
│ - Stock limitado │   │ - Formatos/medidas│   │  diseños pasados) │
│ - Se agota y sale│   │ - Precio base     │   │ - Carruseles      │
│   de esta vista  │   │ - Selección de    │   │ - Inspiración     │
│                  │   │   diseño          │   │ - Pedido por WA   │
└──────────────────┘   └───────────────────┘   └───────────────────┘
```

### A. 📦 Stock Disponible (Drops / Lanzamientos)
- **Dinámica**: Publicaciones periódicas (mensuales o cada 2-3 semanas) con lotes finitos de piezas listas para entrega inmediata (ej. un drop de ~50 a 100 piezas únicas).
- **Comportamiento**: Stock en tiempo real. A medida que se venden, la cantidad baja.
- **Fin de ciclo**: Cuando las piezas de un drop se agotan, ya **no** se muestran en la sección activa de Stock (pasan al histórico/portfolio de la artista, evitando mostrar productos agotados sin sentido en la sección de compra inmediata).

### B. 📋 Catálogo (Piezas Base / Formatos y Medidas)
- **Dinámica**: Lista estática y ordenada (estilo lista/PDF digital, una pieza debajo de otra) con los ~20 a 30 formatos físicos que la artista produce de forma regular (ej. bandeja 40x20cm, bandeja 10x15cm, taza cónica, bowl mediano, etc.).
- **Objetivo**: Que el cliente vea el soporte físico, dimensiones y precio base para **encargar** una pieza a pedido.
- **Personalización/Diseño**: El formato define la pieza; el diseño/ilustración se define posteriormente o se selecciona.

### C. 🎨 Portfolio de Diseños y Colecciones Pasadas
- **Dinámica**: Archivo visual y portfolio de colecciones anteriores (ej. "Colección Argentina", "Colección Botánica", etc.).
- **Visualización**: Formato liviano y visual (galerías / carruseles por colección) para mostrar la variedad de estilos e ilustraciones ya creadas sin sobrecargar la página ni obligar a mantener miles de productos individuales.
- **Acción del Usuario**: 
  1. El cliente puede inspirarse y elegir un diseño del portfolio.
  2. También puede indicar un diseño visto en el feed de Instagram o una idea propia personalizada.
  3. Puede contactar directamente por WhatsApp enviando el pedido vinculado a la colección o diseño elegido.

---

## 4. Identidad Visual y Experiencia Mobile-First (Regla: "Menos es Más")

### 📱 A. Navbar Móvil Ultracompacto (1 Sola Fila)
Actualmente el header ocupa 2 filas con demasiados elementos (logo, texto, luna, carrito, 5 pestañas, perfil). Se unifica en **una sola fila compacta y elegante**:
- **Estructura en 1 sola línea**:
  ```
  ┌─────────────────────────────────────────────────────────────┐
  │ [💡 Logo]   🏺 Cerámica   🎨 Ilustración   🌟 Obras   [🛒] [👤]│
  └─────────────────────────────────────────────────────────────┘
  ```
- **Optimizaciones clave**:
  1. **Se elimina la doble fila**: Pasa de 2 niveles a una barra de navegación esbelta y fija (*sticky glassmorphism*).
  2. **Selector Modo Claro/Oscuro**: Se traslada adentro del menú desplegable del **Perfil (👤)** junto con opciones de cuenta/admin, liberando espacio vital en la barra.
  3. **Botón Carrito (🛒)**: Se mantiene independiente y visible a la derecha con su contador numérico.
  4. **Pestañas de Navegación**: Iconos finos + texto en tamaño proporcionado para no desbordar en pantallas angostas.
  5. **Cero redundancia**: Se eliminan tags secundarios o decoraciones flotantes para que el contenido fotográfico sea el verdadero protagonista.


### 🌟 B. Hero / Portada Principal (Boceto de la Artista)
- **Estructura según el boceto a mano**:
  ```
  ┌───────────────────────────────────────────────────────────┐
  │                                                           │
  │     ✨  M I L I D E A S  💡  (Ilustración de autor)       │
  │             ~  o b j e t o s   d e   d i s e ñ o  ~       │
  │                    ♥   (detalles a mano)   ♥              │
  │                                                           │
  └───────────────────────────────────────────────────────────┘
  ```
- **Banner de Marca**: Diseñado para albergar la ilustración horizontal digitalizada que la artista creará en su iPad.
- **Transición Directa a la Acción**: Inmediatamente debajo del hero se presentan:
  1. Las piezas destacadas del **Drop Activo** (con botón *"Ver todo el Stock Disponible"*).
  2. Los accesos directos a **Cerámica** e **Ilustración**.
  3. La sección personal *"La artista detrás de cada creación"*.

### 👩‍🎨 C. Presentación de la Artista
- **Título**: **"La artista detrás de cada creación"**.
- **Contenido**: Fotografía cálida en su taller y su manifiesto: *"Cada pieza tiene alma propia y provoca una sonrisa"*.
- **Tipografía**: Título en tipografía estilo **Amatic SC** para transmitir impronta artesanal.

### ⚓ D. Nuevo Footer (Limpio y Estructurado)
- **Barra de 4 Propuestas de Valor (Íconos + Texto)**:
  1. 🎨 **Arte ilustrado**
  2. ✨ **Ediciones limitadas**
  3. 📦 **Colecciones nuevas todos los meses**
  4. 🚚 **Embalaje y envío seguro**
- **Pie de página legal & Comunidad**:
  - Enlaces de navegación rápida y redes (Instagram / WhatsApp).
  - *© 2026 Milideas — Hecho con amor en Sunchales, Santa Fe.*

---

## 5. Diseño del Catálogo de Piezas Base (A Pedido)

Basado en el catálogo real de la artista (PDF de piezas):

### 📋 A. Formato de Lista Interactiva
En lugar de fichas pesadas, el catálogo se presenta como una lista/tabla estilizada y optimizada para celulares:
- **Columnas/Datos por fila**:
  - `Foto de referencia` (miniatura expandible con lazy load).
  - `Nombre de la Pieza` (ej. Mate Común con Manija, Cazuela Mediana, Tazón XXL, etc.).
  - `Medidas / Formato` (ej. 16x9 cm, 28 cm diám, etc.).
  - `Precio Base` (ej. $24.375, $27.500, etc.).
  - `Acción`: Botón/Checkbox **"Seleccionar para Encargar"** (permite elegir cantidad y diseño).

### 💡 B. Transformación de "Datos a tener en cuenta" (Micro-información contextual)
Para evitar la "hoja de texto largo" que nadie lee en el PDF, las condiciones clave se transforman en **píldoras informativas / micro-tips visuales** integrados naturalmente en el flujo:
1. 🎨 **Diseños**: *"Podés elegir cualquier diseño de nuestro portfolio o de nuestro feed de Instagram"*.
2. ⏱️ **Tiempos**: *"Producción artesanal: aprox. 30 días según demanda"*.
3. ✨ **Personalizados únicos**: *"Composiciones o personajes exclusivos tienen un +15% adicional"*.
4. 📦 **Envíos**: *"Envíos a todo el país vía encomienda (abona en destino)"*.
5. 🏷️ **Descuentos Mayoristas**: Badge automático en el carrito (*-10% desde 15 u., -15% desde 20 u., -20% desde 35 u.*).

---

## 6. Portfolio de Obras y Proyectos Especiales

Categorías dinámicas gestionables desde el Admin:
1. **Murales & Vidrieras comerciales** (heladerías, bares, domicilios).
2. **Esculturas Tridimensionales** (esculturas de mascotas personalizadas, piezas de autor).
3. **Ilustración en Diferentes Formatos**.
4. **Obras en Gran Dimensión & B2B** (hoteles, ambientaciones, restaurantes).
5. **Miniaturas & Objetos de Colección**.

*En la Home se muestra una tarjeta destacada con foto de cada una de estas categorías para invitar al usuario a explorar y cotizar por WhatsApp.*

---

## 7. Estructura del Panel de Administración (Admin)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PANEL DE ADMINISTRACIÓN                         │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ 🏺 CERÁMICA       │ 🎨 ILUSTRACIÓN    │ 🌟 OBRAS Y PROYECTOS           │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ • Stock / Drop    │ • Stock           │ • Murales & Vidrieras          │
│ • Catálogo Base   │ • Catálogo Base   │ • Esculturas de Mascotas       │
│ • Portfolio       │ • Portfolio       │ • B2B / Hoteles / Miniaturas   │
└───────────────────┴───────────────────┴────────────────────────────────┘
```
## 8. Tono de Voz y Copywriting (Cálido, Cercano y Humilde)

La artista prefiere una comunicación genuina, humilde y libre de frases de venta agresivas o que suenen "agrandadas":
- ❌ **Evitar**: *"Las piezas se agotan rápidamente"* o llamados de urgencia/FOMO artificiales.
- ✅ **Utilizar**:
  - *"Descubrí cerámica y arte ilustrado en ediciones limitadas. Cada lanzamiento reúne piezas únicas hechas a mano con dedicación y amor."*
  - *"Producción artesanal en pequeños lotes."*
  - *"Objetos ilustrados para llenar tus espacios de calidez y alegría."*


