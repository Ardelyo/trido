const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

function getSvg(size) {
  const rx = Math.round(size * (10 / 32));
  const innerSize = size * (18 / 32);
  const offset = (size - innerSize) / 2;
  const scale = innerSize / 24;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${rx}" fill="#1550aa"/>
  <g transform="translate(${offset}, ${offset}) scale(${scale})">
    <path
      d="M7 4.5v15l4.2-4.1 2.9 5.1 2.4-1.3-2.9-5H19L7 4.5Z"
      fill="#ffffff"
      stroke="#ffffff"
      stroke-width="1.2"
      stroke-linejoin="round"
    />
  </g>
</svg>`;
}

function createIco(images) {
  const headerLength = 6;
  const dirEntryLength = 16;
  const totalHeaderLength = headerLength + dirEntryLength * images.length;
  
  let currentOffset = totalHeaderLength;
  const dirBuffers = [];
  const imageBuffers = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.width >= 256 ? 0 : img.width, 0);
    entry.writeUInt8(img.height >= 256 ? 0 : img.height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // size
    entry.writeUInt32LE(currentOffset, 12); // offset
    dirBuffers.push(entry);
    imageBuffers.push(img.buffer);
    currentOffset += img.buffer.length;
  }

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = ICO
  header.writeUInt16LE(images.length, 4); // count

  return Buffer.concat([header, ...dirBuffers, ...imageBuffers]);
}

async function renderPng(browser, size) {
  const page = await browser.newPage();
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  const svg = getSvg(size);
  await page.setContent(`<!DOCTYPE html><html><head><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden;}</style></head><body>${svg}</body></html>`, { waitUntil: 'load' });
  const buffer = await page.screenshot({ omitBackground: true, type: 'png' });
  await page.close();
  return buffer;
}

async function run() {
  const publicDir = path.resolve(__dirname, '..', 'public');
  
  // Write favicon.svg (64x64 vector)
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), getSvg(64), 'utf8');
  console.log('Written favicon.svg');

  // Launch headless browser to render crisp PNGs
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const targets = [
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'logo.png', size: 512 }
  ];

  for (const target of targets) {
    const buffer = await renderPng(browser, target.size);
    fs.writeFileSync(path.join(publicDir, target.name), buffer);
    console.log(`Generated ${target.name} (${target.size}x${target.size})`);
  }

  // Generate multi-size icon.ico for Windows (.exe and installer)
  const icoSizes = [256, 128, 64, 48, 32, 16];
  const icoImages = [];
  for (const size of icoSizes) {
    const buffer = await renderPng(browser, size);
    icoImages.push({ width: size, height: size, buffer });
  }
  const icoBuffer = createIco(icoImages);
  fs.writeFileSync(path.join(publicDir, 'icon.ico'), icoBuffer);
  console.log('Generated icon.ico (256, 128, 64, 48, 32, 16)');

  await browser.close();
  console.log('All branding icons and Windows .ico generated successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
