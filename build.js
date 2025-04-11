const { build } = require('esbuild');
const { copyFile, mkdir } = require('fs/promises');
const { existsSync } = require('fs');
const path = require('path');

async function buildServer() {
  // Build the server code
  await build({
    entryPoints: ['server/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node14',
    outfile: 'dist/server/index.js',
    external: ['express', '@neondatabase/serverless'],
  });
  
  // Ensure the dist directory exists
  if (!existsSync('dist')) {
    await mkdir('dist', { recursive: true });
  }
  
  // Copy necessary files
  await copyFile('.env', 'dist/.env').catch(() => console.log('No .env file to copy'));
}

buildServer().catch(e => {
  console.error(e);
  process.exit(1);
});
