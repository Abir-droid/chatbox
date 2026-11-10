const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const iconsDir = path.join(__dirname, 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. icon.svg (Standard Icon with rounded squircle)
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="50%" stop-color="#1d4ed8" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="bubbleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f0f9ff" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="20" flood-color="#000000" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- High-contrast rounded squircle container -->
  <rect x="24" y="24" width="464" height="464" rx="116" fill="url(#bgGrad)" />

  <!-- Modern Chat Bubble with smooth shadow -->
  <g filter="url(#glow)">
    <path fill="url(#bubbleGrad)" d="M384 244c0-68.48-64.48-124-144-124S96 175.52 96 244c0 39.04 20.96 73.76 53.92 96.48l-15.36 51.36a8 8 0 0 0 10.24 9.92l61.2-23.04c10.72 3.36 22.16 5.28 34 5.28 79.52 0 144-55.52 144-124z"/>
  </g>

  <!-- Modern Conversation Waves / Dots inside bubble -->
  <circle cx="184" cy="244" r="22.4" fill="#2563eb" />
  <circle cx="240" cy="244" r="25.6" fill="#0284c7" />
  <circle cx="296" cy="244" r="22.4" fill="#38bdf8" />

  <!-- Vibrant Real-time Active Pulse Dot -->
  <circle cx="392" cy="120" r="36" fill="#38bdf8" stroke="#0f172a" stroke-width="14" />
</svg>`;

// 2. icon-maskable.svg (Full bleed background, content inside 80% safe zone circle)
const iconMaskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="55%" stop-color="#1d4ed8" />
      <stop offset="100%" stop-color="#0b101b" />
    </linearGradient>
    <linearGradient id="bubbleGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f0f9ff" />
    </linearGradient>
    <filter id="glowMask" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000000" flood-opacity="0.4" />
    </filter>
  </defs>

  <!-- Full bleed background to edges so any mask shape is seamless -->
  <rect width="512" height="512" fill="url(#bgGradMask)" />

  <!-- Content positioned strictly within the centered 80% safe zone (circle r=205 at 256,256) -->
  <g transform="translate(256, 256) scale(0.82) translate(-256, -256)">
    <g filter="url(#glowMask)">
      <path fill="url(#bubbleGradMask)" d="M384 244c0-68.48-64.48-124-144-124S96 175.52 96 244c0 39.04 20.96 73.76 53.92 96.48l-15.36 51.36a8 8 0 0 0 10.24 9.92l61.2-23.04c10.72 3.36 22.16 5.28 34 5.28 79.52 0 144-55.52 144-124z"/>
    </g>

    <!-- Modern Conversation Waves / Dots inside bubble -->
    <circle cx="184" cy="244" r="22.4" fill="#2563eb" />
    <circle cx="240" cy="244" r="25.6" fill="#0284c7" />
    <circle cx="296" cy="244" r="22.4" fill="#38bdf8" />

    <!-- Vibrant Real-time Active Pulse Dot -->
    <circle cx="392" cy="120" r="36" fill="#38bdf8" stroke="#0b101b" stroke-width="14" />
  </g>
</svg>`;

const iconSvgPath = path.join(iconsDir, 'icon.svg');
const iconMaskableSvgPath = path.join(iconsDir, 'icon-maskable.svg');

fs.writeFileSync(iconSvgPath, iconSvg, 'utf8');
fs.writeFileSync(iconMaskableSvgPath, iconMaskableSvg, 'utf8');
console.log('Wrote SVGs to public/icons/');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const targets = [
  { svg: 'icon.svg', png: 'icon-512.png', size: 512 },
  { svg: 'icon.svg', png: 'icon-192.png', size: 192 },
  { svg: 'icon.svg', png: 'apple-touch-icon.png', size: 180 },
  { svg: 'icon-maskable.svg', png: 'icon-maskable-512.png', size: 512 },
  { svg: 'icon-maskable.svg', png: 'icon-maskable-192.png', size: 192 },
];

for (const t of targets) {
  const svgFile = path.join(iconsDir, t.svg);
  const pngFile = path.join(iconsDir, t.png);
  const htmlFile = path.join(iconsDir, `_temp_${t.size}.html`);
  const svgContent = fs.readFileSync(svgFile, 'utf8');
  fs.writeFileSync(
    htmlFile,
    `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent;width:${t.size}px;height:${t.size}px;}svg{display:block;width:100%;height:100%;}</style></head><body>${svgContent}</body></html>`
  );

  const cmd = `"${chromePath}" --headless --screenshot="${pngFile}" --window-size=${t.size},${t.size} --default-background-color=00000000 --hide-scrollbars "file:///${htmlFile.replace(/\\/g, '/')}"`;
  execSync(cmd, { stdio: 'pipe' });
  try {
    fs.unlinkSync(htmlFile);
  } catch {}
  console.log(`Rendered ${t.png} (${t.size}x${t.size}): ${fs.statSync(pngFile).size} bytes`);
}
