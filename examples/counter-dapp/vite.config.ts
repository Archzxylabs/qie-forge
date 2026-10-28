import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const exampleRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(exampleRoot, '../..');

// The example imports the canonical controller and packaged snapshot from the
// repository instead of copying them. The dev server is restricted to this
// checkout, and the production build uses the same source graph.
export default defineConfig({
  server: {
    fs: { allow: [repositoryRoot] },
  },
  build: {
    outDir: path.join(exampleRoot, 'dist'),
    emptyOutDir: true,
  },
});
