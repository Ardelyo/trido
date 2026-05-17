import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function build() {
  console.log('[1/4] Building Vite frontend...');
  // Ensure dist is built (assumes 'npm run build' was run, or we can just let the npm script handle it)

  console.log('[2/4] Bundling Express server...');
  await esbuild.build({
    entryPoints: ['server.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    outfile: 'dist-electron/server-bundle.cjs',
    external: [
      'fsevents',
      'mock-aws-s3',
      'aws-sdk',
      'nock',
      'canvas',
      'socket.io',
      'express',
      'vite',
      '@google/genai',
      '@google-cloud/vertexai'
    ], // Leave native/heavy deps external so electron-builder packs them
    logLevel: 'info',
  });

  console.log('[3/4] Compiling Electron main and preload...');
  // Output as .cjs to force CommonJS even with "type":"module" in package.json
  await esbuild.build({
    entryPoints: { 'main': 'electron/main.ts' },
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    outExtension: { '.js': '.cjs' },
    outdir: 'dist-electron',
    external: ['electron'],
    logLevel: 'info',
  });
  await esbuild.build({
    entryPoints: { 'preload': 'electron/preload.ts' },
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    outExtension: { '.js': '.cjs' },
    outdir: 'dist-electron',
    external: ['electron'],
    logLevel: 'info',
  });

  console.log('[4/4] Copying HTML assets...');
  fs.copyFileSync('electron/splash.html', 'dist-electron/splash.html');
  fs.copyFileSync('electron/setup.html', 'dist-electron/setup.html');
  
  console.log('✅ Electron bundle ready in dist-electron/');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
