import nodeResolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import replace from '@rollup/plugin-replace'
import typescript from 'rollup-plugin-typescript2'
import { terser } from 'rollup-plugin-terser'
import commonjs from 'rollup-plugin-commonjs'
import builtins from 'rollup-plugin-node-builtins';

import pkg from './package.json'

const tsconfigOverride = { 
  compilerOptions: { 
    declaration: false,
    module: 'es2015'
  },
};

const es2015Module = { 
  compilerOptions: { 
    module: 'es2015'
  },
};

export default [
  // CommonJS
  {
    input: 'src/index.ts',
    output: { file: 'lib/jsonCache.js', format: 'cjs', indent: false },
    external: [
      // ...Object.keys(pkg.devDependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: [
      nodeResolve({
        extensions: ['.ts']
      }),
      typescript({ 
        useTsconfigDeclarationDir: true,
        tsconfigOverride: es2015Module
      }),
      babel()
    ]
  },

  // ES
  {
    input: 'src/index.ts',
    output: { file: 'es/jsonCache.js', format: 'es', indent: false },
    external: [
      // ...Object.keys(pkg.devDependencies || {}),
      ...Object.keys(pkg.peerDependencies || {})
    ],
    plugins: [
      nodeResolve({
        extensions: ['.ts']
      }),
      typescript({ tsconfigOverride }),
      babel()
    ]
  },

  // ES for Browsers
  {
    input: 'src/index.ts',
    output: { file: 'es/jsonCache.mjs', format: 'es', indent: false },
    plugins: [
      builtins(),
      nodeResolve({
        extensions: ['.ts'],
      }),
      replace({
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      commonjs({
        include: /node_modules/
      }),
      typescript({ tsconfigOverride }),
      babel({
        exclude: 'node_modules/**'
      }),
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false
        }
      })
    ]
  },

  // UMD Development
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/jsonCache.js',
      format: 'umd',
      name: 'JSONCache',
      indent: false
    },
    plugins: [
      builtins(),
      nodeResolve({
        extensions: ['.ts'],
      }),
      commonjs({
        include: /node_modules/
      }),
      typescript({ tsconfigOverride }),
      babel({
        exclude: 'node_modules/**'
      }),
      replace({
        'process.env.NODE_ENV': JSON.stringify('development')
      })
    ]
  },

  // UMD Production
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/jsonCache.min.js',
      format: 'umd',
      name: 'JSONCache',
      indent: false
    },
    plugins: [
      builtins(),
      nodeResolve({
        extensions: ['.ts'],
      }),
      commonjs({
        include: /node_modules/
      }),
      typescript({ tsconfigOverride }),
      babel({
        exclude: 'node_modules/**'
      }),
      replace({
        'process.env.NODE_ENV': JSON.stringify('production')
      }),
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false
        }
      })
    ]
  }
]