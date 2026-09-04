/**
 * Compresión de imágenes en el cliente (Browser) mediante HTML5 Canvas.
 * Reduce archivos pesados (3MB-8MB) a ~200KB-400KB manteniendo total nitidez y legibilidad
 * de textos en capturas de pantalla, evitando el límite de tamaño de Next.js y Vercel.
 */
export async function comprimirCapturaSoporte(
  file: File,
  maxDimension = 1920,
  calidad = 0.82
): Promise<File> {
  // Si no es una imagen o ya es muy ligera (menos de 350KB), no es necesario comprimir
  if (!file.type.startsWith("image/") || file.size < 350 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        // Escalar proporcionalmente si excede maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        // Fondo blanco para prevenir transparencias negras en caso de convertir PNG a JPEG
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a JPEG para máxima reducción de tamaño en fotos/capturas
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file);
              return;
            }

            const extensionOriginal = file.name.split(".").pop() ?? "jpg";
            const nuevoNombre = file.name.replace(
              new RegExp(`\\.${extensionOriginal}$`, "i"),
              ".jpg"
            );

            const archivoComprimido = new File([blob], nuevoNombre, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            resolve(archivoComprimido);
          },
          "image/jpeg",
          calidad
        );
      };

      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
