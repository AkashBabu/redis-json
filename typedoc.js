module.exports = {
  "name": "redis-json",
  "mode": "file",
  "out": "docs/api",
  "excludePrivate": true,
  "excludeProtected": true,
  excludeNotExported: true,
  stripInternal: true,
  "readme": "none",
  "entryPoint": "./src/index.ts",
  "exclude": [
    "./src/utils/type.ts",
    "./src/utils/key.ts",
    "./src/lib/Flattener.ts",
  ],
  ignoreCompilerErrors: true,
}