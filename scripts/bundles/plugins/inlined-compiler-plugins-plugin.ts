import fs from 'fs-extra';
import { join } from 'path';
import { rollup, Plugin } from 'rollup';
import rollupCommonjs from '@rollup/plugin-commonjs';
import rollupJson from '@rollup/plugin-json';
import rollupNodeResolve from '@rollup/plugin-node-resolve';
import { BuildOptions } from '../../utils/options';

export function inlinedCompilerPluginsPlugin(opts: BuildOptions, inputDir: string): Plugin {
  return {
    name: 'inlinedCompilerPluginsPlugin',
    resolveId(id) {
      if (id === '@compiler-plugins') {
        return id;
      }
      return null;
    },
    load(id) {
      if (id === '@compiler-plugins') {
        return bundleCompilerPlugins(opts, inputDir);
      }
      return null;
    },
  };
}

async function bundleCompilerPlugins(opts: BuildOptions, inputDir: string) {
  const cacheFile = join(opts.transpiledDir, 'compiler-plugins-bundle-cache.js');

  if (!opts.isProd) {
    try {
      return await fs.readFile(cacheFile, 'utf8');
    } catch (e) {}
  }

  const build = await rollup({
    input: join(inputDir, 'sys', 'modules', 'compiler-plugins.js'),
    external: ['fs', 'module', 'path', 'util'],
    plugins: [
      {
        name: 'bundleCompilerPlugins',
        resolveId(id) {
          if (id === 'resolve') {
            return join(opts.bundleHelpersDir, 'resolve.js');
          }
          if (id === '@path-utils') {
            return join(opts.bundleHelpersDir, 'path-utils', 'path-utils.js');
          }
          return null;
        },
      },
      rollupNodeResolve({
        preferBuiltins: false,
      }),
      rollupCommonjs(),
      rollupJson({
        preferConst: true,
      }),
    ],
    treeshake: {
      moduleSideEffects: false,
    },
  });

  await build.write({
    format: 'es',
    file: cacheFile,
  });

  return await fs.readFile(cacheFile, 'utf8');
}
