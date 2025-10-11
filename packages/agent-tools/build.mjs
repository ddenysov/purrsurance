import * as esbuild from 'esbuild';
import { promises as fs } from 'fs';
import path from 'path';

async function build() {
  // Clean dist directory
  try {
    await fs.rm('dist', { recursive: true, force: true });
  } catch (error) {
    // Directory might not exist, ignore
  }

  await fs.mkdir('dist', { recursive: true });

  // Build index.mjs
  await esbuild.build({
    entryPoints: ['index.mjs'],
    bundle: false,
    platform: 'node',
    format: 'esm',
    outfile: 'dist/index.mjs',
    external: [],
  });

  // Build response.mjs
  await esbuild.build({
    entryPoints: ['response.mjs'],
    bundle: false,
    platform: 'node',
    format: 'esm',
    outfile: 'dist/response.mjs',
    external: [],
  });

  console.log('✅ Build completed successfully');
}

build().catch((error) => {
  console.error('Build failed:', error);
  process.exit(1);
});

