
module.exports = {
  presets: [
    '@babel/typescript',
    [
      '@babel/env',
      {
        modules: false,
        loose: true,
        target: {
          exclude: ['transform-async-to-generator', 'transform-regenerator'],
        }
      }
    ]
  ],
  plugins: [
      '@babel/plugin-transform-runtime'
  ],
}