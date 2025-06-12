const esbuild = require('esbuild');
const { chmod } = require('fs/promises');
const { join } = require('path');

async function build() {
  try {
    // Build the main package
    await esbuild.build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node16',
      outfile: 'dist/index.js',
      sourcemap: true,
      minify: false,
      format: 'cjs',
    });

    // Build the CLI executable without a banner
    await esbuild.build({
      entryPoints: ['src/cli.ts'],
      bundle: true,
      platform: 'node',
      target: 'node16',
      outfile: 'bin/encli',
      sourcemap: true,
      minify: false,
      format: 'cjs',
    });

    // Make the CLI executable
    const cliPath = join(__dirname, 'bin/encli');
    await chmod(cliPath, 0o755);

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();