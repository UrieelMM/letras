import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const directory = await mkdtemp(join(tmpdir(), 'wordship-tests-'));
try {
  const outfile = join(directory, 'tests.cjs');
  await build({
    entryPoints: ['tests/all.test.ts'], outfile, bundle: true, platform: 'node', format: 'cjs',
    define: { 'import.meta.env': JSON.stringify({ BASE_URL: '/', PROD: false }), __APP_BUILD_ID__: '"test-build"' },
    plugins: [{
      name: 'in-memory-firestore',
      setup(plugin) {
        plugin.onResolve({ filter: /^firebase\/firestore$/ }, () => ({ path: resolve('tests/fixtures/firestore.ts') }));
        plugin.onResolve({ filter: /firebase\/config$/ }, () => ({ path: resolve('tests/fixtures/config.ts') }));
      },
    }],
  });
  const result = spawnSync(process.execPath, ['--test', outfile], { stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
} finally {
  await rm(directory, { recursive: true, force: true });
}
