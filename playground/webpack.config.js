const path = require('path')

module.exports = {
  mode: 'production',
  entry: './playground/index.tsx',
  output: {
    path: path.resolve(__dirname, '../docs'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  }
}
