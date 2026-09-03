const sharp = require("sharp");
const fs = require("fs");

async function generate() {
  const size = 512;
  const radius = 110; // Apple squircle rounded corner

  // 1. Create rounded squircle background SVG
  const svgBg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="${size - 16}" height="${size - 16}" rx="${radius}" ry="${radius}" fill="#FFFFFF" stroke="#EAE5DE" stroke-width="8"/>
    </svg>
  `;

  // 2. Resize logo
  const logoInnerSize = 390;
  const resizedLogo = await sharp("public/logo-trimmed.png")
    .resize(logoInnerSize, logoInnerSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  // 3. Composite background + logo
  const roundedIcon = await sharp(Buffer.from(svgBg))
    .composite([
      {
        input: resizedLogo,
        top: Math.round((size - logoInnerSize) / 2),
        left: Math.round((size - logoInnerSize) / 2),
      },
    ])
    .png()
    .toBuffer();

  // 4. Save to destinations
  fs.writeFileSync("src/app/icon.png", roundedIcon);
  fs.writeFileSync("src/app/apple-icon.png", roundedIcon);
  fs.writeFileSync("public/icon.png", roundedIcon);
  fs.writeFileSync("public/favicon.ico", roundedIcon);
  fs.writeFileSync("src/app/favicon.ico", roundedIcon);
  fs.writeFileSync("public/logo-squircle.png", roundedIcon);

  console.log("Successfully generated rounded squircle favicon icons!");
}

generate().catch(console.error);
