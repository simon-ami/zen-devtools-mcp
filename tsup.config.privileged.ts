import { defineConfig } from 'tsup';
import { browserConfig, nodeConfig } from './tsup.config';

export default defineConfig([
  { ...nodeConfig, entry: { index: 'src/index.moz.ts' }, outDir: 'dist.privileged' },
  {
    ...browserConfig,
    outDir: 'dist.privileged',
    onSuccess: 'echo "Privileged build completed successfully!"',
  },
]);
