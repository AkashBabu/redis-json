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
        extensions: ['.ts'],
        preferBuiltins: true
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
        extensions: ['.ts'],
        preferBuiltins: true
      }),
      typescript({ tsconfigOverride }),
      babel()
    ]
  },
]