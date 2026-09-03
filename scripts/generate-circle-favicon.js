const sharp = require("sharp");
const fs = require("fs");

async function generateCircleFavicon() {
  const size = 512;
  const radius = size / 2; // 256px -> círculo perfecto

  // 1. Crear círculo blanco perfecto con borde sutil en SVG
  const circleSvg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${radius}" cy="${radius}" r="${radius - 4}" fill="#FFFFFF" stroke="#E0DACF" stroke-width="8"/>
    </svg>
  `;

  // 2. Máscara circular para recortar todo lo exterior con transparencia pura
  const maskSvg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${radius}" cy="${radius}" r="${radius - 2}" fill="#FFFFFF"/>
    </svg>
  `;

  // 3. Redimensionar el logo para que encaje cómodamente dentro del círculo sin tocar los bordes
  const logoInnerSize = 340;
  const resizedLogo = await sharp("public/logo-trimmed.png")
    .resize(logoInnerSize, logoInnerSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  // 4. Componer fondo circular + logo
  const baseCircle = await sharp(Buffer.from(circleSvg))
    .composite([
      {
        input: resizedLogo,
        top: Math.round((size - logoInnerSize) / 2),
        left: Math.round((size - logoInnerSize) / 2),
      },
    ])
    .png()
    .toBuffer();

  // 5. Aplicar máscara circular para garantizar esquinas 100% transparentes
  const circleIcon = await sharp(baseCircle)
    .composite([
      {
        input: Buffer.from(maskSvg),
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  // 6. Guardar en todas las ubicaciones que usa Next.js y navegadores
  fs.writeFileSync("src/app/icon.png", circleIcon);
  fs.writeFileSync("src/app/apple-icon.png", circleIcon);
  fs.writeFileSync("src/app/favicon.ico", circleIcon);
  fs.writeFileSync("public/icon.png", circleIcon);
  fs.writeFileSync("public/favicon.ico", circleIcon);
  fs.writeFileSync("public/logo-circle.png", circleIcon);

  console.log("¡Favicon circular perfecto generado exitosamente!");
}

generateCircleFavicon().catch(console.error);
