const esbuild = require('esbuild');

const isWatching = process.argv.includes('--watch');

esbuild
  .build({
    bundle: true,
    entryPoints: ['./src/index.ts'],
    minify: !isWatching,
    outdir: 'dist',
    platform: 'browser',
    watch: isWatching
      ? {
          onRebuild(error, result) {
            if (error) console.error('watch build failed:', error);
            else console.log('watch build succeeded:', result);
          },
        }
      : undefined,
  })
  .then(() => {
    if (isWatching) {
      console.log('watching...');
    }
  })
  .catch(() => process.exit(1));
